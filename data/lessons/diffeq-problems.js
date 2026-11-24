/**
 * EIGENLAB — Differential Equations & Laplace Paperless Step-by-Step Problem Bank
 * 14 multi-step engineering ODE & Laplace transform problems spanning 5 progressive mastery tiers:
 * Separable ODEs, 1st-Order Linear & Integrating Factor, 2nd-Order Constant-Coefficient ODEs,
 * Forward & Inverse Laplace Transforms, and Solving ODE IVPs via Laplace.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Primary dependent variable y / P(t) / characteristic term / time-domain f(t) / pole 1
 *  - Amber  (#F59E0B): Independent variable t / forcing Q(t) / initial condition / shift parameter a / pole 2
 *  - Emerald(#34D399): Solved step result / integrating factor / roots / Laplace transform F(s) / exact solution y(t)
 */

export const DIFFEQ_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'separable', label: 'Separable' },
  { id: 'linear1', label: '1st-Order' },
  { id: 'second-order', label: '2nd-Order' },
  { id: 'laplace', label: 'Laplace' },
  { id: 'laplace-ivp', label: 'Laplace IVP' },
];

export const DIFFEQ_PROBLEMS = [
  // =========================================================================
  // TIER 1: SEPARABLE ODEs (3 problems)
  // =========================================================================
  {
    id: 'de1-sep-exp',
    tier: 'separable',
    tierLabel: 'Separable',
    title: 'RC Capacitor Exponential Discharge',
    mechatronicsContext:
      'A charged $4\\,\\text{V}$ RC filter capacitor discharging through a bleed resistor obeys $\\frac{dy}{dt} = -3y$ with time constant $\\tau = \\frac{1}{3}\\,\\text{s}$, decaying smoothly toward $0\\,\\text{V}$.',
    expressionLatex: '\\frac{dy}{dt} = -3y, \\quad y(0) = 4',
    finalAnswerLatex: 'y(t) = 4e^{-3t}',
    domain: [0, 2.5],
    initialConditions: { y0: 4 },
    verifyFn: (t) => 4 * Math.exp(-3 * t),
    verifyDerivFn: (t) => -12 * Math.exp(-3 * t),
    odeResidual: (_t, y, dy) => dy + 3 * y,
    steps: [
      {
        stepType: 'separate',
        badge: 'Separate Variables',
        prompt: 'Move all $y$-terms to the left and all $t$-terms (including $dt$) to the right.',
        highlightLatex:
          '\\frac{d\\textcolor{#22D3EE}{y}}{d\\textcolor{#F59E0B}{t}} = \\textcolor{#F59E0B}{-3}\\,\\textcolor{#22D3EE}{y}',
        options: [
          {
            id: 'a',
            latex: 'y\\,dy = -3\\,dt',
            correct: false,
            misconception:
              'Since $y$ multiplies $-3$ on the right, moving it to the left requires dividing by $y$, giving $\\frac{1}{y}\\,dy$.',
          },
          {
            id: 'b',
            latex: '\\frac{1}{y}\\,dy = -3\\,dt',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{1}{y}\\,dy = 3\\,dt',
            correct: false,
            misconception:
              'Keep the negative sign on $-3\\,dt$; flipping it turns capacitor discharge into unstable exponential blow-up.',
          },
          {
            id: 'd',
            latex: 'dy + 3y = dt',
            correct: false,
            misconception:
              'Differentials must be multiplied, not isolated as additive terms; divide by $y$ and multiply both sides by $dt$.',
          },
        ],
        lockedLabel: 'Separated',
        lockedResultLatex: '\\frac{1}{\\textcolor{#22D3EE}{y}}\\,dy = \\textcolor{#F59E0B}{-3\\,dt}',
        hint: 'Divide both sides by $y$ (for $y \\neq 0$) and multiply both sides by $dt$.',
      },
      {
        stepType: 'integrate',
        badge: 'Integrate Both Sides',
        prompt: 'Integrate $\\int \\frac{1}{y}\\,dy = \\int -3\\,dt$ with a single combined constant $C$.',
        highlightLatex:
          '\\int \\frac{1}{\\textcolor{#22D3EE}{y}}\\,dy = \\int \\textcolor{#F59E0B}{-3}\\,dt',
        options: [
          {
            id: 'a',
            latex: '-\\frac{1}{y^2} = -3t + C',
            correct: false,
            misconception:
              'You differentiated $\\frac{1}{y}$ instead of integrating it! The antiderivative of $y^{-1}$ is $\\ln|y|$.',
          },
          {
            id: 'b',
            latex: '\\ln|y| = -\\frac{3}{2}t^2 + C',
            correct: false,
            misconception:
              '$-3$ is a constant, not $-3t$; integrating a constant w.r.t. $t$ gives $-3t$, not $-\\frac{3}{2}t^2$.',
          },
          {
            id: 'c',
            latex: '\\ln|y| = -3t + C',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y = -3t + C',
            correct: false,
            misconception:
              'The left side is $\\int \\frac{1}{y}\\,dy$, which evaluates to $\\ln|y|$, not $y$.',
          },
        ],
        lockedLabel: 'Integrated',
        lockedResultLatex: '\\textcolor{#34D399}{\\ln|y|} = \\textcolor{#34D399}{-3t + C}',
        hint: 'Recall $\\int \\frac{1}{y}\\,dy = \\ln|y|$ and $\\int (-3)\\,dt = -3t$.',
      },
      {
        stepType: 'exponentiate',
        badge: 'Solve for y(t)',
        prompt: 'Exponentiate both sides of $\\ln|y| = -3t + C$ and rewrite $A = \\pm e^C$.',
        highlightLatex:
          'e^{\\textcolor{#22D3EE}{\\ln|y|}} = e^{\\textcolor{#F59E0B}{-3t} + C}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = e^{-3t} + A',
            correct: false,
            misconception:
              'By exponent rules, $e^{-3t + C} = e^C \\cdot e^{-3t} = A e^{-3t}$—the constant multiplies the exponential rather than adding to it!',
          },
          {
            id: 'b',
            latex: 'y(t) = A\\,e^{-3t}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y(t) = A\\,e^{3t}',
            correct: false,
            misconception:
              'Preserve the negative exponent $-3t$ when exponentiating both sides.',
          },
          {
            id: 'd',
            latex: 'y(t) = -3A\\,e^t',
            correct: false,
            misconception:
              'The $-3$ stays inside the exponent as $e^{-3t}$; it does not drop out as a front factor.',
          },
        ],
        lockedLabel: 'General Solution',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{A\\,e^{-3t}}',
        hint: 'Use $e^{u + C} = e^C e^u$ and let $A = \\pm e^C$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Apply Initial Condition',
        prompt: 'Substitute $y(0) = 4$ into $y(t) = A e^{-3t}$ to lock the particular solution.',
        highlightLatex:
          'y(\\textcolor{#F59E0B}{0}) = A\\,e^{-3(\\textcolor{#F59E0B}{0})} = \\textcolor{#22D3EE}{4}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 4e^{-3t}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'y(t) = 4 + e^{-3t}',
            correct: false,
            misconception:
              'Evaluating $4 + e^0$ gives $5 \\neq 4$, and $A$ multiplies $e^{-3t}$ from the general solution.',
          },
          {
            id: 'c',
            latex: 'y(t) = \\frac{4}{3}e^{-3t}',
            correct: false,
            misconception:
              'At $t = 0$, $e^{-3(0)} = 1$, so $A \\cdot 1 = 4$ directly—there is no factor of $\\frac{1}{3}$.',
          },
          {
            id: 'd',
            latex: 'y(t) = e^{-3t + 4}',
            correct: false,
            misconception:
              'At $t = 0$, $e^4 \\approx 54.6 \\neq 4$; set $A = 4$ in front of $e^{-3t}$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 4e^{-3t}}',
        hint: 'Since $e^0 = 1$, plugging $t = 0$ immediately gives $A = 4$.',
      },
    ],
  },

  {
    id: 'de2-sep-poly',
    tier: 'separable',
    tierLabel: 'Separable',
    title: 'Time-Varying Gain Runaway',
    mechatronicsContext:
      'When a feedback gain ramps linearly with time ($k(t) = 2t$), the state rate $\\frac{dy}{dt} = 2t\\,y$ produces super-exponential Gaussian growth $y(t) = 2e^{t^2}$ that saturates actuators rapidly.',
    expressionLatex: '\\frac{dy}{dt} = 2t\\,y, \\quad y(0) = 2',
    finalAnswerLatex: 'y(t) = 2e^{t^2}',
    domain: [0, 1.35],
    initialConditions: { y0: 2 },
    verifyFn: (t) => 2 * Math.exp(t * t),
    verifyDerivFn: (t) => 4 * t * Math.exp(t * t),
    odeResidual: (t, y, dy) => dy - 2 * t * y,
    steps: [
      {
        stepType: 'separate',
        badge: 'Separate Variables',
        prompt: 'Separate the $y$-dependence from the $2t$-dependence.',
        highlightLatex:
          '\\frac{d\\textcolor{#22D3EE}{y}}{d\\textcolor{#F59E0B}{t}} = \\textcolor{#F59E0B}{2t}\\,\\textcolor{#22D3EE}{y}',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{y}\\,dy = 2t\\,dt',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\frac{1}{2y}\\,dy = \\frac{1}{t}\\,dt',
            correct: false,
            misconception:
              '$2t$ is in the numerator on the right—do not invert $t$ when multiplying both sides by $dt$.',
          },
          {
            id: 'c',
            latex: 'y\\,dy = 2t\\,dt',
            correct: false,
            misconception:
              'Divide both sides by $y$ to move it from the right-hand product to the left.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{y}\\,dt = 2t\\,dy',
            correct: false,
            misconception:
              'The differentials are swapped! $dy$ stays with $\\frac{1}{y}$ and $dt$ multiplies $2t$.',
          },
        ],
        lockedLabel: 'Separated',
        lockedResultLatex: '\\frac{1}{\\textcolor{#22D3EE}{y}}\\,dy = \\textcolor{#F59E0B}{2t\\,dt}',
        hint: 'Divide by $y$ and multiply by $dt$ so each side depends on a single variable.',
      },
      {
        stepType: 'integrate',
        badge: 'Integrate Both Sides',
        prompt: 'Evaluate $\\int \\frac{1}{y}\\,dy = \\int 2t\\,dt$.',
        highlightLatex:
          '\\int \\frac{1}{\\textcolor{#22D3EE}{y}}\\,dy = \\int \\textcolor{#F59E0B}{2t}\\,dt',
        options: [
          {
            id: 'a',
            latex: '\\ln|y| = 2t^2 + C',
            correct: false,
            misconception:
              'Check the power rule: $\\int 2t\\,dt = 2\\cdot\\frac{t^2}{2} = t^2$, not $2t^2$.',
          },
          {
            id: 'b',
            latex: '\\ln|y| = 2 + C',
            correct: false,
            misconception:
              'You differentiated $2t$ instead of integrating it! Integrating raises $t^1 \\to t^2$.',
          },
          {
            id: 'c',
            latex: 'y = t^2 + C',
            correct: false,
            misconception:
              'The left integral $\\int \\frac{1}{y}\\,dy$ equals $\\ln|y|$, not $y$.',
          },
          {
            id: 'd',
            latex: '\\ln|y| = t^2 + C',
            correct: true,
          },
        ],
        lockedLabel: 'Integrated',
        lockedResultLatex: '\\textcolor{#34D399}{\\ln|y|} = \\textcolor{#34D399}{t^2 + C}',
        hint: 'Since $\\frac{d}{dt}(t^2) = 2t$, the right-hand antiderivative simplifies cleanly to $t^2 + C$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Exponentiate & Apply IC',
        prompt: 'Solve for $y(t)$ by exponentiating and applying the initial condition $y(0) = 2$.',
        highlightLatex:
          'y(t) = A\\,e^{\\textcolor{#F59E0B}{t^2}}, \\quad y(\\textcolor{#F59E0B}{0}) = \\textcolor{#22D3EE}{2}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = e^{t^2} + 2',
            correct: false,
            misconception:
              'At $t = 0$, $e^0 + 2 = 3 \\neq 2$, and $e^{t^2 + C} = A e^{t^2}$ is multiplicative, not additive.',
          },
          {
            id: 'b',
            latex: 'y(t) = 2e^{2t}',
            correct: false,
            misconception:
              'The exponent is $t^2$ (the integral of $2t$), not $2t$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 2e^{t^2}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y(t) = e^{2t^2}',
            correct: false,
            misconception:
              'At $t = 0$, $e^0 = 1 \\neq 2$; the initial condition multiplies the front as $A = 2$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 2e^{t^2}}',
        hint: 'Exponentiate to get $y(t) = A e^{t^2}$, then plug in $t = 0$ where $e^{0} = 1$.',
      },
    ],
  },

  {
    id: 'de3-sep-power',
    tier: 'separable',
    tierLabel: 'Separable',
    title: 'Hyperbolic Phase-Space Trajectory',
    mechatronicsContext:
      'In a conservative actuator potential, the nonlinear energy balance $y\\frac{dy}{dt} = t$ yields the hyperbolic branch $y(t) = \\sqrt{t^2 + 9}$, where the positive root is selected by $y(0) = 3 > 0$.',
    expressionLatex: '\\frac{dy}{dt} = \\frac{t}{y}, \\quad y(0) = 3',
    finalAnswerLatex: 'y(t) = \\sqrt{t^2 + 9}',
    domain: [0, 4],
    initialConditions: { y0: 3 },
    verifyFn: (t) => Math.sqrt(t * t + 9),
    verifyDerivFn: (t) => t / Math.sqrt(t * t + 9),
    odeResidual: (t, y, dy) => dy - t / y,
    steps: [
      {
        stepType: 'separate',
        badge: 'Separate Variables',
        prompt: 'Cross-multiply to group $y$ with $dy$ and $t$ with $dt$.',
        highlightLatex:
          '\\frac{d\\textcolor{#22D3EE}{y}}{d\\textcolor{#F59E0B}{t}} = \\frac{\\textcolor{#F59E0B}{t}}{\\textcolor{#22D3EE}{y}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{y}\\,dy = t\\,dt',
            correct: false,
            misconception:
              '$y$ is already in the denominator on the right, so multiplying both sides by $y$ puts $y$ in the numerator on the left.',
          },
          {
            id: 'b',
            latex: 'y\\,dy = t\\,dt',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y\\,dt = t\\,dy',
            correct: false,
            misconception:
              'Variables are mixed with the wrong differentials—multiply by $y$ and $dt$ to get $y\\,dy = t\\,dt$.',
          },
          {
            id: 'd',
            latex: 'dy = t\\,y\\,dt',
            correct: false,
            misconception:
              'Multiplying by $y$ cancels the denominator on the right instead of putting $y$ in the numerator there.',
          },
        ],
        lockedLabel: 'Separated',
        lockedResultLatex: '\\textcolor{#22D3EE}{y\\,dy} = \\textcolor{#F59E0B}{t\\,dt}',
        hint: 'Multiply both sides by $y\\,dt$.',
      },
      {
        stepType: 'integrate',
        badge: 'Integrate Both Sides',
        prompt: 'Integrate $\\int y\\,dy = \\int t\\,dt$ and clear the factor of $\\frac{1}{2}$.',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{y}\\,dy = \\int \\textcolor{#F59E0B}{t}\\,dt',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{2}y^2 = \\frac{1}{2}t^2 + C_1 \\implies y^2 = t^2 + C',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\ln|y| = \\frac{1}{2}t^2 + C',
            correct: false,
            misconception:
              'Here we integrate $y^1$, not $y^{-1}$! The reverse power rule gives $\\frac{1}{2}y^2$.',
          },
          {
            id: 'c',
            latex: 'y^2 = 2t^2 + C',
            correct: false,
            misconception:
              'Both sides have the same $\\frac{1}{2}$ factor, so multiplying through by $2$ leaves $y^2 = t^2 + C$.',
          },
          {
            id: 'd',
            latex: 'y = t + C',
            correct: false,
            misconception:
              'Integrating $y\\,dy$ raises the power to $\\frac{1}{2}y^2$, not $y$.',
          },
        ],
        lockedLabel: 'Implicit Form',
        lockedResultLatex: '\\textcolor{#34D399}{y^2 = t^2 + C}',
        hint: 'Multiply $\\frac{1}{2}y^2 = \\frac{1}{2}t^2 + C_1$ by $2$ and absorb $2C_1$ into $C$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Find Constant C',
        prompt: 'Use the initial condition $y(0) = 3$ in $y^2 = t^2 + C$ to determine $C$.',
        highlightLatex:
          '(\\textcolor{#22D3EE}{3})^2 = (\\textcolor{#F59E0B}{0})^2 + C',
        options: [
          {
            id: 'a',
            latex: 'C = 3',
            correct: false,
            misconception:
              'Remember the left side is $y^2$, not $y$! Squaring $y(0) = 3$ gives $C = 3^2 = 9$.',
          },
          {
            id: 'b',
            latex: 'C = -9',
            correct: false,
            misconception:
              'Check the sign: $3^2 = 0^2 + C$ gives positive $C = +9$.',
          },
          {
            id: 'c',
            latex: 'C = 9',
            correct: true,
          },
          {
            id: 'd',
            latex: 'C = 6',
            correct: false,
            misconception:
              'Square $3$ ($3 \\times 3 = 9$), do not double it ($2 \\times 3 = 6$).',
          },
        ],
        lockedLabel: 'Constant',
        lockedResultLatex: '\\textcolor{#34D399}{C = 9} \\implies y^2 = t^2 + 9',
        hint: 'Substitute $t = 0$ and $y = 3$ directly into $y^2 = t^2 + C$.',
      },
      {
        stepType: 'solve_explicit',
        badge: 'Select Branch',
        prompt: 'Take the square root of $y^2 = t^2 + 9$ and select the sign branch matching $y(0) = +3$.',
        highlightLatex:
          'y(t) = \\pm\\sqrt{t^2 + \\textcolor{#34D399}{9}}, \\quad y(0) = \\textcolor{#22D3EE}{+3}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = t + 3',
            correct: false,
            misconception:
              'A square root does not distribute over addition! $\\sqrt{t^2 + 9} \\neq t + 3$.',
          },
          {
            id: 'b',
            latex: 'y(t) = -\\sqrt{t^2 + 9}',
            correct: false,
            misconception:
              'The negative branch gives $y(0) = -3$, violating $y(0) = +3$.',
          },
          {
            id: 'c',
            latex: 'y(t) = \\sqrt{t^2 + 3}',
            correct: false,
            misconception:
              'Keep $C = 9$ under the radical so that $y(0) = \\sqrt{9} = 3$.',
          },
          {
            id: 'd',
            latex: 'y(t) = \\sqrt{t^2 + 9}',
            correct: true,
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = \\sqrt{t^2 + 9}}',
        hint: 'Choose the positive square root so $y(0) = +\\sqrt{0 + 9} = 3$, and never split $\\sqrt{a + b}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: 1st-ORDER LINEAR & INTEGRATING FACTOR (3 problems)
  // =========================================================================
  {
    id: 'de4-if-step',
    tier: 'linear1',
    tierLabel: '1st-Order',
    title: 'DC Motor Step-Input Spin-Up',
    mechatronicsContext:
      'Applying a constant $6\\,\\text{V}$ step to a first-order DC motor armature ($\\frac{d\\omega}{dt} + 2\\omega = 6$, $\\omega(0) = 0$) drives angular speed exponentially to its steady-state value $3\\,\\text{rad/s}$.',
    expressionLatex: '\\frac{dy}{dt} + 2y = 6, \\quad y(0) = 0',
    finalAnswerLatex: 'y(t) = 3\\left(1 - e^{-2t}\\right)',
    domain: [0, 3],
    initialConditions: { y0: 0 },
    verifyFn: (t) => 3 * (1 - Math.exp(-2 * t)),
    verifyDerivFn: (t) => 6 * Math.exp(-2 * t),
    odeResidual: (_t, y, dy) => dy + 2 * y - 6,
    steps: [
      {
        stepType: 'integrating_factor',
        badge: 'Integrating Factor',
        prompt: 'Identify $P(t) = 2$ in $y\' + P(t)y = Q(t)$ and compute the integrating factor $\\mu(t) = e^{\\int P(t)\\,dt}$.',
        highlightLatex:
          '\\frac{dy}{dt} + \\textcolor{#22D3EE}{2}\\,y = \\textcolor{#F59E0B}{6}, \\quad \\mu(t) = e^{\\int \\textcolor{#22D3EE}{2}\\,dt}',
        options: [
          {
            id: 'a',
            latex: '\\mu(t) = e^{-2t}',
            correct: false,
            misconception:
              'Watch the sign: $P(t) = +2$ on the left-hand side, so $\\mu(t) = e^{+2t}$ (the negative exponent appears later when dividing by $\\mu$).',
          },
          {
            id: 'b',
            latex: '\\mu(t) = 2t',
            correct: false,
            misconception:
              '$2t$ is $\\int P(t)\\,dt$; you still need to exponentiate it to form $\\mu(t) = e^{2t}$.',
          },
          {
            id: 'c',
            latex: '\\mu(t) = e^{2t}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mu(t) = e^{6t}',
            correct: false,
            misconception:
              'Use $P(t) = 2$ (the coefficient of $y$), not the right-hand forcing $Q(t) = 6$.',
          },
        ],
        lockedLabel: 'Integrating Factor',
        lockedResultLatex: '\\mu(t) = \\textcolor{#34D399}{e^{2t}}',
        hint: 'Compute $\\int 2\\,dt = 2t$ and place it in the exponent of $e$.',
      },
      {
        stepType: 'product_rule_collapse',
        badge: 'Collapse Product Rule',
        prompt: 'Multiply the entire ODE by $\\mu(t) = e^{2t}$ and collapse the left side into a single derivative.',
        highlightLatex:
          '\\textcolor{#34D399}{e^{2t}}\\frac{dy}{dt} + 2\\textcolor{#34D399}{e^{2t}}y = \\textcolor{#F59E0B}{6}\\textcolor{#34D399}{e^{2t}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{d}{dt}\\!\\left(e^{2t}\\,y\\right) = 6e^{2t}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\frac{d}{dt}\\!\\left(e^{2t}\\,y\\right) = 6',
            correct: false,
            misconception:
              'You must multiply BOTH sides of the ODE by $\\mu(t) = e^{2t}$, including the forcing term $6$!',
          },
          {
            id: 'c',
            latex: '\\frac{d}{dt}\\!\\left(e^{-2t}\\,y\\right) = 6e^{2t}',
            correct: false,
            misconception:
              'Check the sign inside the derivative: $\\frac{d}{dt}(e^{2t}y) = e^{2t}y\' + 2e^{2t}y$ matches $+2y$.',
          },
          {
            id: 'd',
            latex: '\\frac{d}{dt}\\!\\left(2e^{2t}\\,y\\right) = 6e^{2t}',
            correct: false,
            misconception:
              'The factor $2$ comes from differentiating $e^{2t}$ by the chain rule—it does not sit inside the parentheses.',
          },
        ],
        lockedLabel: 'Product Form',
        lockedResultLatex: '\\frac{d}{dt}\\!\\left(\\textcolor{#34D399}{e^{2t}\\,y}\\right) = \\textcolor{#F59E0B}{6e^{2t}}',
        hint: 'The whole point of $\\mu(t)$ is that $\\mu y\' + \\mu P y = \\frac{d}{dt}(\\mu y)$ automatically.',
      },
      {
        stepType: 'integrate_solve',
        badge: 'Integrate & Isolate y',
        prompt: 'Integrate both sides of $\\frac{d}{dt}(e^{2t}y) = 6e^{2t}$ and divide by $e^{2t}$.',
        highlightLatex:
          'e^{2t}\\,y = \\int \\textcolor{#F59E0B}{6e^{2t}}\\,dt = \\textcolor{#34D399}{3e^{2t} + C}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 3 + C',
            correct: false,
            misconception:
              'When dividing $3e^{2t} + C$ by $e^{2t}$, you must divide $C$ too! That gives $Ce^{-2t}$, not $C$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 12 + Ce^{-2t}',
            correct: false,
            misconception:
              'Integrating $6e^{2t}$ divides by $2$ ($6/2 = 3$), rather than multiplying by $2$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 3e^{2t} + Ce^{-2t}',
            correct: false,
            misconception:
              'Dividing $3e^{2t}$ by $e^{2t}$ cancels the exponential completely, leaving the steady-state constant $3$.',
          },
          {
            id: 'd',
            latex: 'y(t) = 3 + Ce^{-2t}',
            correct: true,
          },
        ],
        lockedLabel: 'General Solution',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{3 + Ce^{-2t}}',
        hint: 'First compute $\\int 6e^{2t}\\,dt = 3e^{2t} + C$, then multiply every term by $e^{-2t}$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Apply Initial Condition',
        prompt: 'Enforce $y(0) = 0$ on $y(t) = 3 + Ce^{-2t}$ to obtain the step response.',
        highlightLatex:
          'y(\\textcolor{#F59E0B}{0}) = 3 + C\\,e^{0} = \\textcolor{#22D3EE}{0}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 3\\left(1 + e^{-2t}\\right)',
            correct: false,
            misconception:
              'At $t = 0$, $3(1 + 1) = 6 \\neq 0$. Solving $3 + C = 0$ gives $C = -3$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 3\\left(1 - e^{-2t}\\right)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y(t) = 6\\left(1 - e^{-2t}\\right)',
            correct: false,
            misconception:
              'The steady-state gain is $Q/P = 6/2 = 3$, not $6$.',
          },
          {
            id: 'd',
            latex: 'y(t) = 3e^{-2t}',
            correct: false,
            misconception:
              'That starts at $y(0) = 3$ and decays to $0$, instead of starting at $0$ and rising to $3$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 3\\left(1 - e^{-2t}\\right)}',
        hint: 'Solve $3 + C = 0 \\implies C = -3$, then factor out $3$.',
      },
    ],
  },

  {
    id: 'de5-if-resonant',
    tier: 'linear1',
    tierLabel: '1st-Order',
    title: 'Matched-Mode Exponential Forcing',
    mechatronicsContext:
      'When an input pulse $e^{-t}$ matches a first-order filter\'s natural decay pole ($s = -1$), the output picks up a secular ramp factor $t\\,e^{-t}$ before decaying—the time-domain signature of a repeated pole.',
    expressionLatex: '\\frac{dy}{dt} + y = e^{-t}, \\quad y(0) = 1',
    finalAnswerLatex: 'y(t) = (t + 1)e^{-t}',
    domain: [0, 4.5],
    initialConditions: { y0: 1 },
    verifyFn: (t) => (t + 1) * Math.exp(-t),
    verifyDerivFn: (t) => -t * Math.exp(-t),
    odeResidual: (t, y, dy) => dy + y - Math.exp(-t),
    steps: [
      {
        stepType: 'integrating_factor',
        badge: 'Integrating Factor',
        prompt: 'Find the integrating factor $\\mu(t)$ for $y\' + 1\\cdot y = e^{-t}$.',
        highlightLatex:
          '\\frac{dy}{dt} + \\textcolor{#22D3EE}{1}\\cdot y = \\textcolor{#F59E0B}{e^{-t}}',
        options: [
          {
            id: 'a',
            latex: '\\mu(t) = e^{t}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mu(t) = e^{-t}',
            correct: false,
            misconception:
              'Here $P(t) = +1$, so $\\mu(t) = e^{\\int 1\\,dt} = e^{+t}$, not $e^{-t}$.',
          },
          {
            id: 'c',
            latex: '\\mu(t) = t',
            correct: false,
            misconception:
              '$t = \\int 1\\,dt$ is the exponent of $\\mu(t)$; exponentiate to get $e^t$.',
          },
          {
            id: 'd',
            latex: '\\mu(t) = e^{e^{-t}}',
            correct: false,
            misconception:
              'Integrate $P(t) = 1$ (coefficient of $y$), not the forcing function $Q(t) = e^{-t}$.',
          },
        ],
        lockedLabel: 'Integrating Factor',
        lockedResultLatex: '\\mu(t) = \\textcolor{#34D399}{e^{t}}',
        hint: 'With $P(t) = 1$, $\\mu(t) = e^{\\int 1\\,dt} = e^t$.',
      },
      {
        stepType: 'product_rule_collapse',
        badge: 'Multiply & Simplify RHS',
        prompt: 'Multiply the ODE by $\\mu(t) = e^t$ and simplify the right-hand side $e^t \\cdot e^{-t}$.',
        highlightLatex:
          '\\frac{d}{dt}\\!\\left(\\textcolor{#34D399}{e^t}\\,y\\right) = \\textcolor{#34D399}{e^t} \\cdot \\textcolor{#F59E0B}{e^{-t}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{d}{dt}\\!\\left(e^t\\,y\\right) = 0',
            correct: false,
            misconception:
              '$e^t \\cdot e^{-t} = e^{t - t} = e^0 = 1$, NOT $0$!',
          },
          {
            id: 'b',
            latex: '\\frac{d}{dt}\\!\\left(e^t\\,y\\right) = e^{-t^2}',
            correct: false,
            misconception:
              'When multiplying same-base powers, ADD exponents: $t + (-t) = 0$, giving $e^0 = 1$.',
          },
          {
            id: 'c',
            latex: '\\frac{d}{dt}\\!\\left(e^t\\,y\\right) = 1',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\frac{d}{dt}\\!\\left(e^t\\,y\\right) = e^{2t}',
            correct: false,
            misconception:
              'Check the exponent signs: $e^{+t} \\cdot e^{-t} = e^{0} = 1$.',
          },
        ],
        lockedLabel: 'Collapsed ODE',
        lockedResultLatex: '\\frac{d}{dt}\\!\\left(\\textcolor{#34D399}{e^t\\,y}\\right) = \\textcolor{#F59E0B}{1}',
        hint: 'Add the exponents: $e^t e^{-t} = e^0 = 1$.',
      },
      {
        stepType: 'integrate_solve',
        badge: 'Integrate & Isolate y',
        prompt: 'Integrate $\\frac{d}{dt}(e^t y) = 1$ with respect to $t$ and solve for $y(t)$.',
        highlightLatex:
          'e^t\\,y = \\int \\textcolor{#F59E0B}{1}\\,dt = \\textcolor{#34D399}{t + C}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = t\\,e^{-t} + C',
            correct: false,
            misconception:
              'Divide the entire right side $(t + C)$ by $e^t$, so $C$ is also multiplied by $e^{-t}$.',
          },
          {
            id: 'b',
            latex: 'y(t) = (t + C)e^{t}',
            correct: false,
            misconception:
              'To isolate $y$ from $e^t y = t + C$, multiply by $e^{-t}$, not $e^{+t}$.',
          },
          {
            id: 'c',
            latex: 'y(t) = (t + C)e^{-t}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y(t) = C\\,e^{-t}',
            correct: false,
            misconception:
              'Do not drop the integral of $1$: $\\int 1\\,dt = t + C$, which produces the crucial $t\\,e^{-t}$ term.',
          },
        ],
        lockedLabel: 'General Solution',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{(t + C)e^{-t}}',
        hint: 'Integrate $1$ to get $t + C$, then multiply both terms by $e^{-t}$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Apply Initial Condition',
        prompt: 'Use $y(0) = 1$ in $y(t) = (t + C)e^{-t}$ to lock the particular solution.',
        highlightLatex:
          'y(\\textcolor{#F59E0B}{0}) = (\\textcolor{#F59E0B}{0} + C)e^{0} = \\textcolor{#22D3EE}{1}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = t\\,e^{-t} + 1',
            correct: false,
            misconception:
              '$1$ must stay inside the parentheses multiplying $e^{-t}$, otherwise $y\' + y$ would equal $e^{-t} + 1$.',
          },
          {
            id: 'b',
            latex: 'y(t) = (t + 1)e^{-t}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y(t) = (t - 1)e^{-t}',
            correct: false,
            misconception:
              'At $t = 0$, $(0 - 1)e^0 = -1 \\neq +1$; we need $C = +1$.',
          },
          {
            id: 'd',
            latex: 'y(t) = t\\,e^{-t}',
            correct: false,
            misconception:
              'At $t = 0$, $t\\,e^{-t}$ evaluates to $0$, not $1$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = (t + 1)e^{-t}}',
        hint: 'Substitute $t = 0$: $(0 + C) \\cdot 1 = 1 \\implies C = 1$.',
      },
    ],
  },

  {
    id: 'de6-if-cooling',
    tier: 'linear1',
    tierLabel: '1st-Order',
    title: 'Thermal Sensor Warm-Up (Newton Law)',
    mechatronicsContext:
      'A thermistor starting at $4^\\circ\\text{C}$ placed in a $20^\\circ\\text{C}$ servo housing obeys $\\frac{dy}{dt} + 0.5y = 10$, warming toward ambient with time constant $\\tau = 2\\,\\text{s}$.',
    expressionLatex: '\\frac{dy}{dt} + 0.5y = 10, \\quad y(0) = 4',
    finalAnswerLatex: 'y(t) = 20 - 16e^{-0.5t}',
    domain: [0, 6],
    initialConditions: { y0: 4 },
    verifyFn: (t) => 20 - 16 * Math.exp(-0.5 * t),
    verifyDerivFn: (t) => 8 * Math.exp(-0.5 * t),
    odeResidual: (_t, y, dy) => dy + 0.5 * y - 10,
    steps: [
      {
        stepType: 'integrating_factor',
        badge: 'Integrating Factor',
        prompt: 'Compute the integrating factor $\\mu(t) = e^{\\int P(t)\\,dt}$ for $y\' + 0.5y = 10$.',
        highlightLatex:
          '\\frac{dy}{dt} + \\textcolor{#22D3EE}{0.5}\\,y = \\textcolor{#F59E0B}{10}',
        options: [
          {
            id: 'a',
            latex: '\\mu(t) = e^{-0.5t}',
            correct: false,
            misconception:
              'Since $P(t) = +0.5$, the integrating factor has a positive exponent: $\\mu(t) = e^{+0.5t}$.',
          },
          {
            id: 'b',
            latex: '\\mu(t) = e^{0.5t}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mu(t) = 0.5e^{t}',
            correct: false,
            misconception:
              'The constant $0.5$ integrates inside the exponent: $\\int 0.5\\,dt = 0.5t \\implies e^{0.5t}$.',
          },
          {
            id: 'd',
            latex: '\\mu(t) = e^{2t}',
            correct: false,
            misconception:
              '$2$ is the time constant $1/0.5$, but the exponent uses $P(t) = 0.5$ directly.',
          },
        ],
        lockedLabel: 'Integrating Factor',
        lockedResultLatex: '\\mu(t) = \\textcolor{#34D399}{e^{0.5t}}',
        hint: 'Integrate $P(t) = 0.5$ to get $0.5t$, then exponentiate.',
      },
      {
        stepType: 'integrate_rhs',
        badge: 'Integrate RHS',
        prompt: 'After multiplying by $e^{0.5t}$, integrate $\\frac{d}{dt}(e^{0.5t}y) = 10e^{0.5t}$.',
        highlightLatex:
          'e^{0.5t}\\,y = \\int \\textcolor{#F59E0B}{10}\\,\\textcolor{#34D399}{e^{0.5t}}\\,dt',
        options: [
          {
            id: 'a',
            latex: 'e^{0.5t}\\,y = 5e^{0.5t} + C',
            correct: false,
            misconception:
              'Careful! Integrating $e^{0.5t}$ DIVIDES by $0.5$ (which multiplies by $2$): $\\frac{10}{0.5} = 20$, not $5$.',
          },
          {
            id: 'b',
            latex: 'e^{0.5t}\\,y = 10e^{0.5t} + C',
            correct: false,
            misconception:
              'Don\'t forget the chain-rule reciprocal $\\frac{1}{0.5} = 2$ when integrating $e^{0.5t}$.',
          },
          {
            id: 'c',
            latex: 'e^{0.5t}\\,y = 20e^{0.5t} + C',
            correct: true,
          },
          {
            id: 'd',
            latex: 'e^{0.5t}\\,y = 20t\\,e^{0.5t} + C',
            correct: false,
            misconception:
              'An exponential integrates back to a pure exponential without picking up a factor of $t$.',
          },
        ],
        lockedLabel: 'Integrated Form',
        lockedResultLatex: 'e^{0.5t}\\,y = \\textcolor{#34D399}{20e^{0.5t} + C}',
        hint: 'Use $\\int e^{kt}\\,dt = \\frac{1}{k}e^{kt}$ with $k = 0.5$, so $\\frac{10}{0.5} = 20$.',
      },
      {
        stepType: 'isolate_y',
        badge: 'General Solution',
        prompt: 'Divide both sides of $e^{0.5t}y = 20e^{0.5t} + C$ by $e^{0.5t}$.',
        highlightLatex:
          'y(t) = \\frac{\\textcolor{#34D399}{20e^{0.5t}} + C}{\\textcolor{#22D3EE}{e^{0.5t}}}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 20 + C',
            correct: false,
            misconception:
              'Dividing $C$ by $e^{0.5t}$ produces the transient decay term $Ce^{-0.5t}$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 20 + Ce^{0.5t}',
            correct: false,
            misconception:
              'Dividing by $e^{+0.5t}$ flips the exponent sign to $e^{-0.5t}$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 20e^{-0.5t} + C',
            correct: false,
            misconception:
              'The $e^{0.5t}$ cancels out of $20e^{0.5t}$ (leaving ambient $20$) and attaches as $e^{-0.5t}$ to $C$.',
          },
          {
            id: 'd',
            latex: 'y(t) = 20 + Ce^{-0.5t}',
            correct: true,
          },
        ],
        lockedLabel: 'General Solution',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{20 + Ce^{-0.5t}}',
        hint: 'Distribute $e^{-0.5t}$ across both $20e^{0.5t}$ and $C$.',
      },
      {
        stepType: 'apply_ic',
        badge: 'Apply Initial Condition',
        prompt: 'Solve for $C$ using $y(0) = 4$ in $y(t) = 20 + Ce^{-0.5t}$.',
        highlightLatex:
          'y(\\textcolor{#F59E0B}{0}) = 20 + C\\,e^{0} = \\textcolor{#22D3EE}{4}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 20 - 16e^{-0.5t}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'y(t) = 20 + 4e^{-0.5t}',
            correct: false,
            misconception:
              'That starts at $y(0) = 24$, not $4$! Solve $20 + C = 4 \\implies C = -16$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 20 + 16e^{-0.5t}',
            correct: false,
            misconception:
              'Check the sign: $C = 4 - 20 = -16$, so the sensor starts $16^\\circ\\text{C}$ BELOW ambient.',
          },
          {
            id: 'd',
            latex: 'y(t) = 4 + 16e^{-0.5t}',
            correct: false,
            misconception:
              'As $t \\to \\infty$, the steady-state temperature must approach $20$, not $4$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 20 - 16e^{-0.5t}}',
        hint: 'Subtract $20$ from both sides of $20 + C = 4$.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: 2nd-ORDER CONSTANT-COEFFICIENT ODEs (3 problems)
  // =========================================================================
  {
    id: 'de7-2nd-real',
    tier: 'second-order',
    tierLabel: '2nd-Order',
    title: 'Overdamped Suspension Return',
    mechatronicsContext:
      'An overdamped door closer or heavy suspension strut ($y\'\' + 5y\' + 6y = 0$) has two distinct real negative poles ($r = -2, -3$), returning smoothly to equilibrium without a single overshoot.',
    expressionLatex: 'y\'\' + 5y\' + 6y = 0, \\quad y(0) = 2, \\; y\'(0) = -5',
    finalAnswerLatex: 'y(t) = e^{-2t} + e^{-3t}',
    domain: [0, 2.5],
    initialConditions: { y0: 2, dy0: -5 },
    verifyFn: (t) => Math.exp(-2 * t) + Math.exp(-3 * t),
    verifyDerivFn: (t) => -2 * Math.exp(-2 * t) - 3 * Math.exp(-3 * t),
    odeResidual: (_t, y, dy, d2y) => d2y + 5 * dy + 6 * y,
    steps: [
      {
        stepType: 'characteristic',
        badge: 'Characteristic Roots',
        prompt: 'Substitute $y = e^{rt}$ to form $r^2 + 5r + 6 = 0$ and find both characteristic roots.',
        highlightLatex:
          '\\textcolor{#22D3EE}{r^2 + 5r + 6} = 0',
        options: [
          {
            id: 'a',
            latex: 'r_1 = 2, \\quad r_2 = 3',
            correct: false,
            misconception:
              'Watch the signs! $(r + 2)(r + 3) = 0$ gives negative roots $r = -2, -3$ (stable decay).',
          },
          {
            id: 'b',
            latex: 'r_1 = -2, \\quad r_2 = -3',
            correct: true,
          },
          {
            id: 'c',
            latex: 'r_1 = -1, \\quad r_2 = -6',
            correct: false,
            misconception:
              'Check the sum: $(-1) + (-6) = -7 \\neq -5$. We need two numbers multiplying to $+6$ and summing to $+5$ in $(r+a)(r+b)$.',
          },
          {
            id: 'd',
            latex: 'r_1 = -5, \\quad r_2 = -6',
            correct: false,
            misconception:
              'Do not read coefficients straight off as roots—factor $r^2 + 5r + 6 = (r + 2)(r + 3)$.',
          },
        ],
        lockedLabel: 'Roots',
        lockedResultLatex: '(r + 2)(r + 3) = 0 \\implies \\textcolor{#34D399}{r_1 = -2, \\; r_2 = -3}',
        hint: 'Factor $r^2 + 5r + 6$ into $(r + 2)(r + 3) = 0$.',
      },
      {
        stepType: 'general_solution',
        badge: 'General Solution',
        prompt: 'Build the general solution from the two distinct real roots $r_1 = -2$ and $r_2 = -3$.',
        highlightLatex:
          'r_1 = \\textcolor{#22D3EE}{-2}, \\quad r_2 = \\textcolor{#F59E0B}{-3}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = (c_1 + c_2 t)e^{-2t}',
            correct: false,
            misconception:
              'The $t\\,e^{rt}$ form is only for REPEATED roots; here $r_1 = -2$ and $r_2 = -3$ are distinct.',
          },
          {
            id: 'b',
            latex: 'y(t) = c_1 \\cos(2t) + c_2 \\sin(3t)',
            correct: false,
            misconception:
              'Sines and cosines come from complex conjugate roots; real roots yield pure exponentials.',
          },
          {
            id: 'c',
            latex: 'y(t) = c_1 e^{-2t} + c_2 e^{-3t}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y(t) = c_1 e^{2t} + c_2 e^{3t}',
            correct: false,
            misconception:
              'Keep the negative root signs in the exponents: $e^{-2t}$ and $e^{-3t}$.',
          },
        ],
        lockedLabel: 'General Form',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{c_1 e^{-2t} + c_2 e^{-3t}}',
        hint: 'For distinct real roots $r_1, r_2$, superimpose $c_1 e^{r_1 t} + c_2 e^{r_2 t}$.',
      },
      {
        stepType: 'ic_system',
        badge: 'IC Linear System',
        prompt: 'Differentiate $y(t)$ to get $y\'(t) = -2c_1 e^{-2t} - 3c_2 e^{-3t}$, then evaluate $y(0) = 2$ and $y\'(0) = -5$.',
        highlightLatex:
          'y(\\textcolor{#F59E0B}{0}) = \\textcolor{#22D3EE}{2}, \\quad y\'(\\textcolor{#F59E0B}{0}) = \\textcolor{#22D3EE}{-5}',
        options: [
          {
            id: 'a',
            latex: '\\begin{cases} c_1 + c_2 = 2 \\\\ -2c_1 - 3c_2 = -5 \\end{cases}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\begin{cases} c_1 + c_2 = 2 \\\\ 2c_1 + 3c_2 = -5 \\end{cases}',
            correct: false,
            misconception:
              'Differentiating $e^{-2t}$ and $e^{-3t}$ pulls down NEGATIVE signs: $-2c_1 - 3c_2 = -5$.',
          },
          {
            id: 'c',
            latex: '\\begin{cases} -2c_1 - 3c_2 = 2 \\\\ c_1 + c_2 = -5 \\end{cases}',
            correct: false,
            misconception:
              'You swapped the two initial conditions: $y(0) = 2$ goes with $c_1 + c_2$, and $y\'(0) = -5$ goes with $-2c_1 - 3c_2$.',
          },
          {
            id: 'd',
            latex: '\\begin{cases} c_1 = 2 \\\\ c_2 = -5 \\end{cases}',
            correct: false,
            misconception:
              'Both exponentials equal $1$ at $t = 0$, so $y(0)$ and $y\'(0)$ couple $c_1$ and $c_2$ together.',
          },
        ],
        lockedLabel: 'IC System',
        lockedResultLatex: '\\textcolor{#22D3EE}{c_1 + c_2 = 2}, \\quad \\textcolor{#F59E0B}{-2c_1 - 3c_2 = -5}',
        hint: 'Set $t = 0$ in both $y(t)$ and $y\'(t)$, noting $e^0 = 1$.',
      },
      {
        stepType: 'solve_constants',
        badge: 'Solve c₁ & c₂',
        prompt: 'Solve $c_1 + c_2 = 2$ and $-2c_1 - 3c_2 = -5$ to finalize $y(t)$.',
        highlightLatex:
          '2(c_1 + c_2) + (-2c_1 - 3c_2) = 4 - 5 \\implies \\textcolor{#34D399}{-c_2 = -1}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 2e^{-2t} - e^{-3t}',
            correct: false,
            misconception:
              'Check $y(0)$: $2 - 1 = 1 \\neq 2$. Here $c_2 = 1$ and $c_1 = 2 - 1 = 1$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 3e^{-2t} - e^{-3t}',
            correct: false,
            misconception:
              'Check $y\'(0)$: $-2(3) - 3(-1) = -3 \\neq -5$. Both constants are $+1$.',
          },
          {
            id: 'c',
            latex: 'y(t) = -e^{-2t} + 3e^{-3t}',
            correct: false,
            misconception:
              'Check $y\'(0)$: $-2(-1) - 3(3) = -7 \\neq -5$.',
          },
          {
            id: 'd',
            latex: 'y(t) = e^{-2t} + e^{-3t}',
            correct: true,
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = e^{-2t} + e^{-3t}}',
        hint: 'From $-c_2 = -1$ we get $c_2 = 1$, and then $c_1 = 2 - c_2 = 1$.',
      },
    ],
  },

  {
    id: 'de8-2nd-crit',
    tier: 'second-order',
    tierLabel: '2nd-Order',
    title: 'Critically Damped Robotic Arm',
    mechatronicsContext:
      'A critically damped PD joint controller ($y\'\' + 4y\' + 4y = 0$, $\\zeta = 1$) places a double pole at $r = -2$, yielding the fastest possible settling without oscillation.',
    expressionLatex: 'y\'\' + 4y\' + 4y = 0, \\quad y(0) = 1, \\; y\'(0) = 1',
    finalAnswerLatex: 'y(t) = (1 + 3t)e^{-2t}',
    domain: [0, 3],
    initialConditions: { y0: 1, dy0: 1 },
    verifyFn: (t) => (1 + 3 * t) * Math.exp(-2 * t),
    verifyDerivFn: (t) => (1 - 6 * t) * Math.exp(-2 * t),
    odeResidual: (_t, y, dy, d2y) => d2y + 4 * dy + 4 * y,
    steps: [
      {
        stepType: 'characteristic',
        badge: 'Characteristic Root',
        prompt: 'Factor the characteristic equation $r^2 + 4r + 4 = 0$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{r^2 + 4r + 4} = 0',
        options: [
          {
            id: 'a',
            latex: '(r + 2)^2 = 0 \\implies r = -2 \\;\\text{(repeated)}',
            correct: true,
          },
          {
            id: 'b',
            latex: '(r - 2)^2 = 0 \\implies r = +2 \\;\\text{(repeated)}',
            correct: false,
            misconception:
              '$(r - 2)^2 = r^2 - 4r + 4$; the $+4r$ middle term requires $(r + 2)^2$, giving $r = -2$.',
          },
          {
            id: 'c',
            latex: '(r + 2)(r - 2) = 0 \\implies r = \\pm 2',
            correct: false,
            misconception:
              '$(r + 2)(r - 2) = r^2 - 4$ has no $4r$ term and a $-4$ constant.',
          },
          {
            id: 'd',
            latex: 'r = -2 \\pm 2i',
            correct: false,
            misconception:
              'Compute the discriminant $\\Delta = b^2 - 4ac = 16 - 16 = 0$, meaning a real repeated root, not complex roots.',
          },
        ],
        lockedLabel: 'Repeated Root',
        lockedResultLatex: '(r + 2)^2 = 0 \\implies \\textcolor{#34D399}{r = -2 \\;\\text{(double root)}}',
        hint: 'Check the discriminant $4^2 - 4(1)(4) = 0$: this is a perfect square $(r + 2)^2$.',
      },
      {
        stepType: 'general_solution',
        badge: 'Repeated-Root Form',
        prompt: 'Write the general solution for a repeated real root $r = -2$.',
        highlightLatex:
          'r_1 = r_2 = \\textcolor{#34D399}{-2}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = c_1 e^{-2t} + c_2 e^{-2t}',
            correct: false,
            misconception:
              '$c_1 e^{-2t} + c_2 e^{-2t} = (c_1 + c_2)e^{-2t}$ collapses to ONE independent solution! Multiply the second term by $t$.',
          },
          {
            id: 'b',
            latex: 'y(t) = (c_1 + c_2 t)e^{-2t}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y(t) = e^{-2t}(c_1 \\cos 2t + c_2 \\sin 2t)',
            correct: false,
            misconception:
              'Trigonometric modes only appear when the discriminant is negative (complex roots).',
          },
          {
            id: 'd',
            latex: 'y(t) = c_1 e^{-2t} + c_2 t',
            correct: false,
            misconception:
              'The second independent solution is $t\\,e^{-2t}$, not a bare ramp $t$.',
          },
        ],
        lockedLabel: 'General Form',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{(c_1 + c_2 t)e^{-2t}}',
        hint: 'To keep two linearly independent solutions for a double root $r$, use $e^{rt}$ and $t\\,e^{rt}$.',
      },
      {
        stepType: 'derivative_ic',
        badge: 'Differentiate & Apply y(0)',
        prompt: 'Apply $y(0) = 1$ to get $c_1 = 1$, and compute $y\'(t)$ using the product rule on $(c_1 + c_2 t)e^{-2t}$.',
        highlightLatex:
          '\\frac{d}{dt}\\!\\Big[(\\textcolor{#22D3EE}{c_1 + c_2 t})\\,\\textcolor{#F59E0B}{e^{-2t}}\\Big]',
        options: [
          {
            id: 'a',
            latex: 'y\'(t) = -2c_2\\,e^{-2t}',
            correct: false,
            misconception:
              'Don\'t multiply derivatives! Use the product rule $(uv)\' = u\'v + uv\'$.',
          },
          {
            id: 'b',
            latex: 'y\'(t) = c_2 e^{-2t} + 2(c_1 + c_2 t)e^{-2t}',
            correct: false,
            misconception:
              'Watch the chain-rule sign: $(e^{-2t})\' = -2e^{-2t}$, not $+2e^{-2t}$.',
          },
          {
            id: 'c',
            latex: 'y\'(t) = c_2 e^{-2t} - 2(c_1 + c_2 t)e^{-2t}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y\'(t) = -2(c_1 + c_2 t)e^{-2t}',
            correct: false,
            misconception:
              'You forgot the $u\'v$ term from differentiating $(c_1 + c_2 t)$, which contributes $+c_2 e^{-2t}$.',
          },
        ],
        lockedLabel: 'Derivative & c₁',
        lockedResultLatex: '\\textcolor{#34D399}{c_1 = 1}, \\quad y\'(t) = \\textcolor{#34D399}{\\big(c_2 - 2(c_1 + c_2 t)\\big)e^{-2t}}',
        hint: 'Apply $(u\\cdot v)\' = u\'v + uv\'$ with $u = c_1 + c_2 t$ and $v = e^{-2t}$.',
      },
      {
        stepType: 'solve_constants',
        badge: 'Solve c₂ from y\'(0)',
        prompt: 'Substitute $c_1 = 1$ and $t = 0$ into $y\'(0) = c_2 - 2c_1 = 1$ to finalize $y(t)$.',
        highlightLatex:
          'y\'(\\textcolor{#F59E0B}{0}) = c_2 - 2(\\textcolor{#34D399}{1}) = \\textcolor{#22D3EE}{1}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = (1 + t)e^{-2t}',
            correct: false,
            misconception:
              'If $c_2 = 1$, then $y\'(0) = 1 - 2(1) = -1 \\neq +1$. Don\'t forget the $-2c_1$ contribution!',
          },
          {
            id: 'b',
            latex: 'y(t) = (1 - t)e^{-2t}',
            correct: false,
            misconception:
              'Solving $c_2 - 2 = 1$ adds $2$ to both sides, giving $c_2 = +3$, not $-1$.',
          },
          {
            id: 'c',
            latex: 'y(t) = (1 + 3t)e^{-2t}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y(t) = (3 + t)e^{-2t}',
            correct: false,
            misconception:
              '$c_1 = 1$ (from $y(0) = 1$) and $c_2 = 3$ multiply $1$ and $t$ respectively—do not swap them.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = (1 + 3t)e^{-2t}}',
        hint: 'Add $2$ to both sides of $c_2 - 2 = 1$ to get $c_2 = 3$.',
      },
    ],
  },

  {
    id: 'de9-2nd-complex',
    tier: 'second-order',
    tierLabel: '2nd-Order',
    title: 'Underdamped RLC / Spring Ringing',
    mechatronicsContext:
      'An underdamped micro-actuator or series RLC circuit ($y\'\' + 2y\' + 5y = 0$) has complex conjugate poles $r = -1 \\pm 2i$: it rings at damped frequency $\\omega_d = 2\\,\\text{rad/s}$ inside an $e^{-t}$ decay envelope.',
    expressionLatex: 'y\'\' + 2y\' + 5y = 0, \\quad y(0) = 1, \\; y\'(0) = 1',
    finalAnswerLatex: 'y(t) = e^{-t}(\\cos 2t + \\sin 2t)',
    domain: [0, 4.5],
    initialConditions: { y0: 1, dy0: 1 },
    verifyFn: (t) => Math.exp(-t) * (Math.cos(2 * t) + Math.sin(2 * t)),
    verifyDerivFn: (t) => Math.exp(-t) * (Math.cos(2 * t) - 3 * Math.sin(2 * t)),
    odeResidual: (_t, y, dy, d2y) => d2y + 2 * dy + 5 * y,
    steps: [
      {
        stepType: 'characteristic',
        badge: 'Complex Poles',
        prompt: 'Use the quadratic formula on $r^2 + 2r + 5 = 0$ to find the poles $\\alpha \\pm i\\omega$.',
        highlightLatex:
          'r = \\frac{-\\textcolor{#22D3EE}{2} \\pm \\sqrt{\\textcolor{#22D3EE}{2}^2 - 4(1)(\\textcolor{#F59E0B}{5})}}{2}',
        options: [
          {
            id: 'a',
            latex: 'r = -1 \\pm 4i',
            correct: false,
            misconception:
              'Don\'t forget to divide $\\sqrt{-16} = 4i$ by $2$: $\\frac{4i}{2} = 2i$.',
          },
          {
            id: 'b',
            latex: 'r = 1 \\pm 2i',
            correct: false,
            misconception:
              'Check the sign of $-b/(2a) = -2/2 = -1$. Positive $+1$ would grow unstably!',
          },
          {
            id: 'c',
            latex: 'r = -1 \\pm 2i',
            correct: true,
          },
          {
            id: 'd',
            latex: 'r = -2 \\pm i',
            correct: false,
            misconception:
              'Check the quadratic formula: $\\alpha = -2/2 = -1$ and $\\omega = \\sqrt{16}/2 = 2$.',
          },
        ],
        lockedLabel: 'Complex Roots',
        lockedResultLatex: '\\textcolor{#34D399}{r = -1 \\pm 2i} \\quad (\\alpha = -1, \\; \\omega = 2)',
        hint: 'Simplify $\\frac{-2 \\pm \\sqrt{-16}}{2} = \\frac{-2 \\pm 4i}{2}$.',
      },
      {
        stepType: 'general_solution',
        badge: 'Damped Sinusoid Form',
        prompt: 'Convert the complex conjugate pair $r = \\alpha \\pm i\\omega = -1 \\pm 2i$ into its real general solution.',
        highlightLatex:
          '\\alpha = \\textcolor{#22D3EE}{-1}, \\quad \\omega = \\textcolor{#F59E0B}{2}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = e^{-2t}(c_1 \\cos t + c_2 \\sin t)',
            correct: false,
            misconception:
              'You swapped $\\alpha$ and $\\omega$! The real part $\\alpha = -1$ sets the decay $e^{-t}$, and $\\omega = 2$ sets the frequency $\\cos(2t), \\sin(2t)$.',
          },
          {
            id: 'b',
            latex: 'y(t) = e^{-t}(c_1 \\cos 2t + c_2 \\sin 2t)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'y(t) = c_1 e^{-t} + c_2 e^{2t}',
            correct: false,
            misconception:
              'Imaginary parts $\\pm 2i$ produce oscillations via Euler\'s formula $e^{i2t} = \\cos 2t + i\\sin 2t$, not real exponentials.',
          },
          {
            id: 'd',
            latex: 'y(t) = e^{t}(c_1 \\cos 2t + c_2 \\sin 2t)',
            correct: false,
            misconception:
              'Since $\\alpha = -1$, the envelope must decay as $e^{-t}$.',
          },
        ],
        lockedLabel: 'General Form',
        lockedResultLatex: 'y(t) = \\textcolor{#34D399}{e^{-t}(c_1 \\cos 2t + c_2 \\sin 2t)}',
        hint: 'Use $y(t) = e^{\\alpha t}(c_1 \\cos\\omega t + c_2 \\sin\\omega t)$.',
      },
      {
        stepType: 'apply_ic_pos',
        badge: 'Apply y(0) & Find y\'(0)',
        prompt: 'From $y(0) = c_1 = 1$, evaluate $y\'(0)$ using the product rule on $e^{-t}(c_1\\cos 2t + c_2\\sin 2t)$.',
        highlightLatex:
          'y\'(0) = \\textcolor{#22D3EE}{-c_1} + \\textcolor{#F59E0B}{2c_2} = \\textcolor{#34D399}{1}, \\quad c_1 = 1',
        options: [
          {
            id: 'a',
            latex: 'y\'(0) = 2c_2 = 1 \\implies c_2 = \\frac{1}{2}',
            correct: false,
            misconception:
              'You missed the product-rule derivative of the decay envelope $e^{-t}$, which adds $-c_1 = -1$ at $t = 0$!',
          },
          {
            id: 'b',
            latex: 'y\'(0) = -c_1 + c_2 = 1 \\implies c_2 = 2',
            correct: false,
            misconception:
              'By the chain rule, $\\frac{d}{dt}(\\sin 2t)\\big|_{t=0} = 2\\cos 0 = 2$, so the $c_2$ coefficient is $2c_2$.',
          },
          {
            id: 'c',
            latex: 'y\'(0) = -c_1 + 2c_2 = 1 \\implies c_2 = 1',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y\'(0) = c_1 + 2c_2 = 1 \\implies c_2 = 0',
            correct: false,
            misconception:
              'The derivative of $e^{-t}$ is $-e^{-t}$, contributing $-c_1$ (not $+c_1$) to $y\'(0)$.',
          },
        ],
        lockedLabel: 'Constants',
        lockedResultLatex: '\\textcolor{#34D399}{c_1 = 1, \\quad c_2 = 1}',
        hint: 'At $t = 0$, $y\'(0) = \\alpha c_1 + \\omega c_2 = -1(1) + 2c_2 = 1$.',
      },
      {
        stepType: 'assemble',
        badge: 'Particular Solution',
        prompt: 'Substitute $c_1 = 1$ and $c_2 = 1$ into the damped sinusoid.',
        highlightLatex:
          'y(t) = e^{-t}\\!\\left(\\textcolor{#34D399}{1}\\cdot\\cos 2t + \\textcolor{#34D399}{1}\\cdot\\sin 2t\\right)',
        options: [
          {
            id: 'a',
            latex: 'y(t) = e^{-t}(\\cos 2t + \\sin 2t)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'y(t) = e^{-t}(\\cos 2t + 2\\sin 2t)',
            correct: false,
            misconception:
              'Solving $-1 + 2c_2 = 1$ gives $2c_2 = 2 \\implies c_2 = 1$, not $2$.',
          },
          {
            id: 'c',
            latex: 'y(t) = e^{-t}(\\cos t + \\sin t)',
            correct: false,
            misconception:
              'Keep the angular frequency $\\omega = 2$ inside both trigonometric functions.',
          },
          {
            id: 'd',
            latex: 'y(t) = e^{-t}(\\cos 2t - \\sin 2t)',
            correct: false,
            misconception:
              'With $-\\sin 2t$, $y\'(0) = -1 - 2 = -3 \\neq +1$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = e^{-t}(\\cos 2t + \\sin 2t)}',
        hint: 'Combine $c_1 = 1$ and $c_2 = 1$ inside $e^{-t}(c_1 \\cos 2t + c_2 \\sin 2t)$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: FORWARD & INVERSE LAPLACE TRANSFORMS (3 problems)
  // =========================================================================
  {
    id: 'de10-lap-forward',
    tier: 'laplace',
    tierLabel: 'Laplace',
    title: 'Linearity: Exponential + Sine Signal',
    mechatronicsContext:
      'Transforming a composite drive signal $f(t) = 3e^{-2t} + 4\\sin(5t)$ into the $s$-domain lets control engineers read its pole locations ($s = -2$ and $s = \\pm 5i$) by inspection.',
    expressionLatex: '\\mathcal{L}\\!\\left\\{3e^{-2t} + 4\\sin(5t)\\right\\}',
    finalAnswerLatex: '\\mathcal{L}\\!\\left\\{3e^{-2t} + 4\\sin(5t)\\right\\} = \\frac{3}{s+2} + \\frac{20}{s^2+25}',
    domain: [0, 3],
    sDomain: [0.2, 6],
    verifyKind: 'laplace-forward',
    verifyFn: (t) => 3 * Math.exp(-2 * t) + 4 * Math.sin(5 * t),
    verifyTransformFn: (s) => 3 / (s + 2) + 20 / (s * s + 25),
    steps: [
      {
        stepType: 'linearity',
        badge: 'Apply Linearity',
        prompt: 'Split the Laplace transform across the sum and pull out the constant gains $3$ and $4$.',
        highlightLatex:
          '\\mathcal{L}\\!\\left\\{\\textcolor{#22D3EE}{3e^{-2t}} + \\textcolor{#F59E0B}{4\\sin(5t)}\\right\\}',
        options: [
          {
            id: 'a',
            latex: '3\\,\\mathcal{L}\\{e^{-2t}\\} \\cdot 4\\,\\mathcal{L}\\{\\sin(5t)\\}',
            correct: false,
            misconception:
              'Linearity preserves addition—do not turn a sum into a product of transforms!',
          },
          {
            id: 'b',
            latex: '3\\,\\mathcal{L}\\{e^{-2t}\\} + 4\\,\\mathcal{L}\\{\\sin(5t)\\}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{3}{s}\\,\\mathcal{L}\\{e^{-2t}\\} + \\frac{4}{s}\\,\\mathcal{L}\\{\\sin(5t)\\}',
            correct: false,
            misconception:
              'Scalar constants pull straight outside $\\mathcal{L}\\{\\cdot\\}$ unchanged; only $\\mathcal{L}\\{1\\} = \\frac{1}{s}$.',
          },
          {
            id: 'd',
            latex: '3\\,\\mathcal{L}\\{e^{-2t}\\} + 20\\,\\mathcal{L}\\{\\sin(t)\\}',
            correct: false,
            misconception:
              'You cannot pull the angular frequency $5$ outside $\\sin(5t)$!',
          },
        ],
        lockedLabel: 'Linearity',
        lockedResultLatex: '\\textcolor{#22D3EE}{3\\,\\mathcal{L}\\{e^{-2t}\\}} + \\textcolor{#F59E0B}{4\\,\\mathcal{L}\\{\\sin(5t)\\}}',
        hint: 'Because $\\mathcal{L}$ is an integral operator, $\\mathcal{L}\\{af + bg\\} = a\\mathcal{L}\\{f\\} + b\\mathcal{L}\\{g\\}$.',
      },
      {
        stepType: 'transform_exp',
        badge: 'Exponential Term',
        prompt: 'Transform the first term $3\\,\\mathcal{L}\\{e^{-2t}\\}$ using $\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s - a}$.',
        highlightLatex:
          '3\\,\\mathcal{L}\\!\\left\\{e^{\\textcolor{#22D3EE}{-2}t}\\right\\}',
        options: [
          {
            id: 'a',
            latex: '\\frac{3}{s - 2}',
            correct: false,
            misconception:
              'Watch the sign: with $a = -2$, $s - a = s - (-2) = s + 2$ (a stable left-half-plane pole!).',
          },
          {
            id: 'b',
            latex: '\\frac{-6}{s + 2}',
            correct: false,
            misconception:
              'The exponent $-2$ shifts the pole to $s + 2$; it does NOT multiply the numerator $3$.',
          },
          {
            id: 'c',
            latex: '\\frac{3}{s + 2}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\frac{3s}{s + 2}',
            correct: false,
            misconception:
              'The numerator of $\\mathcal{L}\\{e^{at}\\}$ is $1$ (scaled by $3$), with no $s$ factor.',
          },
        ],
        lockedLabel: 'Exp Transform',
        lockedResultLatex: '3\\,\\mathcal{L}\\{e^{-2t}\\} = \\textcolor{#34D399}{\\frac{3}{s + 2}}',
        hint: 'Plug $a = -2$ into $\\frac{1}{s - a}$ and multiply by $3$.',
      },
      {
        stepType: 'transform_sin',
        badge: 'Sine Term',
        prompt: 'Transform $4\\,\\mathcal{L}\\{\\sin(5t)\\}$ using $\\mathcal{L}\\{\\sin(\\omega t)\\} = \\frac{\\omega}{s^2 + \\omega^2}$.',
        highlightLatex:
          '4\\,\\mathcal{L}\\!\\left\\{\\sin(\\textcolor{#F59E0B}{5}t)\\right\\}',
        options: [
          {
            id: 'a',
            latex: '\\frac{4s}{s^2 + 25}',
            correct: false,
            misconception:
              '$\\frac{s}{s^2 + \\omega^2}$ is for $\\cos(\\omega t)$! Sine puts $\\omega = 5$ in the numerator, giving $4 \\cdot 5 = 20$.',
          },
          {
            id: 'b',
            latex: '\\frac{4}{s^2 + 25}',
            correct: false,
            misconception:
              'You forgot the $\\omega = 5$ in the numerator of $\\mathcal{L}\\{\\sin(5t)\\} = \\frac{5}{s^2 + 25}$!',
          },
          {
            id: 'c',
            latex: '\\frac{20}{s^2 + 5}',
            correct: false,
            misconception:
              'Square $\\omega$ in the denominator: $5^2 = 25$, not $5$.',
          },
          {
            id: 'd',
            latex: '\\frac{20}{s^2 + 25}',
            correct: true,
          },
        ],
        lockedLabel: 'Sine Transform',
        lockedResultLatex: '4\\,\\mathcal{L}\\{\\sin(5t)\\} = \\textcolor{#34D399}{\\frac{20}{s^2 + 25}}',
        hint: 'Multiply $4$ by $\\frac{5}{s^2 + 5^2}$.',
      },
      {
        stepType: 'assemble',
        badge: 'Combine F(s)',
        prompt: 'Sum both transformed components to complete $F(s)$.',
        highlightLatex:
          'F(s) = \\textcolor{#34D399}{\\frac{3}{s+2}} + \\textcolor{#34D399}{\\frac{20}{s^2+25}}',
        options: [
          {
            id: 'a',
            latex: 'F(s) = \\frac{3}{s+2} + \\frac{20}{s^2+25}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'F(s) = \\frac{3}{s-2} + \\frac{20}{s^2+25}',
            correct: false,
            misconception:
              'Check the first denominator: $e^{-2t}$ transforms to $\\frac{1}{s + 2}$.',
          },
          {
            id: 'c',
            latex: 'F(s) = \\frac{3}{s+2} + \\frac{4s}{s^2+25}',
            correct: false,
            misconception:
              'The second term is $\\sin(5t)$, not $\\cos(5t)$, so its numerator is $20$, not $4s$.',
          },
          {
            id: 'd',
            latex: 'F(s) = \\frac{23}{(s+2)(s^2+25)}',
            correct: false,
            misconception:
              'You cannot simply add numerators and multiply denominators when adding fractions!',
          },
        ],
        lockedLabel: 'Final Transform',
        lockedResultLatex: '\\textcolor{#34D399}{F(s) = \\frac{3}{s+2} + \\frac{20}{s^2+25}}',
        hint: 'Add the two locked fractions from the Step Ledger above.',
      },
    ],
  },

  {
    id: 'de11-lap-shift',
    tier: 'laplace',
    tierLabel: 'Laplace',
    title: 'First Shifting Theorem: Damped Cosine',
    mechatronicsContext:
      'Multiplying a carrier $\\cos(4t)$ by a decay envelope $e^{-3t}$ shifts every $s$ in its transform to $s + 3$—moving the poles from $\\pm 4i$ directly into the left half-plane at $-3 \\pm 4i$.',
    expressionLatex: '\\mathcal{L}\\!\\left\\{e^{-3t}\\cos(4t)\\right\\}',
    finalAnswerLatex: '\\mathcal{L}\\!\\left\\{e^{-3t}\\cos(4t)\\right\\} = \\frac{s+3}{(s+3)^2 + 16}',
    domain: [0, 2.5],
    sDomain: [0.2, 6],
    verifyKind: 'laplace-forward',
    verifyFn: (t) => Math.exp(-3 * t) * Math.cos(4 * t),
    verifyTransformFn: (s) => (s + 3) / ((s + 3) * (s + 3) + 16),
    steps: [
      {
        stepType: 'identify_shift',
        badge: 'First Shifting Theorem',
        prompt: 'Recognize the exponential damping factor $e^{-3t}$ multiplying $g(t) = \\cos(4t)$. Which Laplace rule applies?',
        highlightLatex:
          '\\mathcal{L}\\!\\left\\{\\textcolor{#F59E0B}{e^{-3t}}\\,\\textcolor{#22D3EE}{\\cos(4t)}\\right\\}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{L}\\{e^{-at}g(t)\\} = \\frac{1}{s+a} \\cdot G(s)',
            correct: false,
            misconception:
              'Laplace transforms do NOT multiply term-by-term! An exponential factor $e^{-at}$ SHIFTS the argument $s \\to s + a$.',
          },
          {
            id: 'b',
            latex: '\\mathcal{L}\\{e^{-at}g(t)\\} = G(s + a) \\;\\text{ with } a = 3',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{L}\\{e^{-at}g(t)\\} = G(s - a) \\;\\text{ with } a = 3',
            correct: false,
            misconception:
              'Careful with the sign: $\\int_0^\\infty e^{-st} e^{-3t} g(t)\\,dt = \\int_0^\\infty e^{-(s+3)t} g(t)\\,dt = G(s + 3)$.',
          },
          {
            id: 'd',
            latex: '\\mathcal{L}\\{e^{-at}g(t)\\} = e^{-as}\\,G(s)',
            correct: false,
            misconception:
              '$e^{-as}G(s)$ is the Second Shifting Theorem for time-delayed step signals $u(t-a)g(t-a)$, not exponential damping.',
          },
        ],
        lockedLabel: 'Shifting Rule',
        lockedResultLatex: '\\mathcal{L}\\{e^{-3t}g(t)\\} = \\textcolor{#34D399}{G(s + 3)}',
        hint: 'Combine $e^{-st} e^{-3t} = e^{-(s+3)t}$ inside the Laplace integral definition.',
      },
      {
        stepType: 'base_transform',
        badge: 'Base Transform G(s)',
        prompt: 'Compute the unshifted transform $G(s) = \\mathcal{L}\\{\\cos(4t)\\}$.',
        highlightLatex:
          'G(s) = \\mathcal{L}\\!\\left\\{\\cos(\\textcolor{#22D3EE}{4}t)\\right\\}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{4}{s^2 + 16}',
            correct: false,
            misconception:
              '$\\frac{4}{s^2 + 16}$ is $\\mathcal{L}\\{\\sin(4t)\\}$; cosine places $s$ in the numerator.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{s}{s^2 + 4}',
            correct: false,
            misconception:
              'Square the frequency $\\omega = 4$ in the denominator: $4^2 = 16$, not $4$.',
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{s}{s^2 - 16}',
            correct: false,
            misconception:
              '$s^2 - 16$ belongs to hyperbolic $\\cosh(4t)$; circular $\\cos(4t)$ has $+16$.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{s}{s^2 + 16}',
            correct: true,
          },
        ],
        lockedLabel: 'Base G(s)',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{s}{s^2 + 16}}',
        hint: 'Recall $\\mathcal{L}\\{\\cos(\\omega t)\\} = \\frac{s}{s^2 + \\omega^2}$ with $\\omega = 4$.',
      },
      {
        stepType: 'apply_shift',
        badge: 'Replace s → s + 3',
        prompt: 'Replace EVERY occurrence of $s$ in $G(s) = \\frac{s}{s^2 + 16}$ with $(s + 3)$.',
        highlightLatex:
          'G(\\textcolor{#F59E0B}{s + 3}) = \\left.\\frac{\\textcolor{#22D3EE}{s}}{\\textcolor{#22D3EE}{s}^2 + 16}\\right|_{\\textcolor{#22D3EE}{s} \\to \\textcolor{#F59E0B}{s + 3}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{s}{(s+3)^2 + 16}',
            correct: false,
            misconception:
              'Classic pitfall! You shifted $s$ in the denominator but forgot to shift the $s$ in the NUMERATOR to $s + 3$.',
          },
          {
            id: 'b',
            latex: '\\frac{s + 3}{(s + 3)^2 + 16}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{s + 3}{s^2 + 19}',
            correct: false,
            misconception:
              'Shift $s \\to s + 3$ inside the square: $(s+3)^2 + 16 = s^2 + 6s + 25$, not $s^2 + 19$.',
          },
          {
            id: 'd',
            latex: '\\frac{s - 3}{(s - 3)^2 + 16}',
            correct: false,
            misconception:
              '$e^{-3t}$ shifts $s$ to $s + 3$ (not $s - 3$), placing the poles at $s = -3 \\pm 4i$.',
          },
        ],
        lockedLabel: 'Shifted Transform',
        lockedResultLatex: '\\textcolor{#34D399}{F(s) = \\frac{s + 3}{(s + 3)^2 + 16}}',
        hint: 'Both the numerator $s$ and the squared $s^2$ must become $(s + 3)$.',
      },
    ],
  },

  {
    id: 'de12-lap-inv-pf',
    tier: 'laplace',
    tierLabel: 'Laplace',
    title: 'Inverse Laplace via Partial Fractions',
    mechatronicsContext:
      'Inverting a two-pole transfer function $H(s) = \\frac{5}{(s+1)(s+6)}$ splits the impulse response into a slow mode $e^{-t}$ minus a fast mode $e^{-6t}$ so the output rises smoothly from zero.',
    expressionLatex: '\\mathcal{L}^{-1}\\!\\left\\{\\frac{5}{(s+1)(s+6)}\\right\\}',
    finalAnswerLatex: '\\mathcal{L}^{-1}\\!\\left\\{\\frac{5}{(s+1)(s+6)}\\right\\} = e^{-t} - e^{-6t}',
    domain: [0, 3.5],
    sDomain: [0.2, 6],
    verifyKind: 'laplace-inverse',
    verifyFn: (t) => Math.exp(-t) - Math.exp(-6 * t),
    verifyDerivFn: (t) => -Math.exp(-t) + 6 * Math.exp(-6 * t),
    verifyTransformFn: (s) => 5 / ((s + 1) * (s + 6)),
    steps: [
      {
        stepType: 'partial_fraction_setup',
        badge: 'Partial Fraction Setup',
        prompt: 'Decompose $\\frac{5}{(s+1)(s+6)}$ into a sum of first-order pole terms.',
        highlightLatex:
          '\\frac{5}{(\\textcolor{#22D3EE}{s + 1})(\\textcolor{#F59E0B}{s + 6})} = \\frac{A}{\\textcolor{#22D3EE}{s + 1}} + \\frac{B}{\\textcolor{#F59E0B}{s + 6}}',
        options: [
          {
            id: 'a',
            latex: '5 = A(s + 1) + B(s + 6)',
            correct: false,
            misconception:
              'When clearing denominators, each numerator multiplies the OTHER factor: $A(s+6) + B(s+1) = 5$.',
          },
          {
            id: 'b',
            latex: '5 = A(s + 6) + B(s + 1)',
            correct: true,
          },
          {
            id: 'c',
            latex: '5 = A + B',
            correct: false,
            misconception:
              'You must multiply each term by the full LCD $(s+1)(s+6)$ before equating numerators.',
          },
          {
            id: 'd',
            latex: '5 = A(s + 6) - B(s + 1)',
            correct: false,
            misconception:
              'Keep the plus sign in the setup $A(s+6) + B(s+1) = 5$; solving will automatically reveal the negative sign of $B$.',
          },
        ],
        lockedLabel: 'Cleared LCD',
        lockedResultLatex: '5 = \\textcolor{#22D3EE}{A(s + 6)} + \\textcolor{#F59E0B}{B(s + 1)}',
        hint: 'Multiply both sides of $\\frac{5}{(s+1)(s+6)} = \\frac{A}{s+1} + \\frac{B}{s+6}$ by $(s+1)(s+6)$.',
      },
      {
        stepType: 'cover_up_a',
        badge: 'Residue at s = -1',
        prompt: 'Set $s = -1$ (Heaviside cover-up) in $5 = A(s + 6) + B(s + 1)$ to find $A$.',
        highlightLatex:
          '5 = A(\\textcolor{#22D3EE}{-1} + 6) + B(\\textcolor{#22D3EE}{-1} + 1)',
        options: [
          {
            id: 'a',
            latex: 'A = 5',
            correct: false,
            misconception:
              'Divide $5$ by $(-1 + 6) = 5$: $A = \\frac{5}{5} = 1$, not $5$.',
          },
          {
            id: 'b',
            latex: 'A = -1',
            correct: false,
            misconception:
              'Check the sign: $-1 + 6 = +5$, so $5A = 5 \\implies A = +1$.',
          },
          {
            id: 'c',
            latex: 'A = \\frac{5}{7}',
            correct: false,
            misconception:
              'Plug in $s = -1$ (the root of $s + 1 = 0$), not $s = +1$.',
          },
          {
            id: 'd',
            latex: 'A = 1',
            correct: true,
          },
        ],
        lockedLabel: 'Residue A',
        lockedResultLatex: '\\textcolor{#34D399}{A = 1}',
        hint: 'At $s = -1$, the $B$ term vanishes and $5 = 5A$.',
      },
      {
        stepType: 'cover_up_b',
        badge: 'Residue at s = -6',
        prompt: 'Now set $s = -6$ in $5 = A(s + 6) + B(s + 1)$ to solve for $B$.',
        highlightLatex:
          '5 = A(\\textcolor{#F59E0B}{-6} + 6) + B(\\textcolor{#F59E0B}{-6} + 1)',
        options: [
          {
            id: 'a',
            latex: 'B = 1',
            correct: false,
            misconception:
              'Watch the sign! $-6 + 1 = -5$, so $-5B = 5 \\implies B = -1$.',
          },
          {
            id: 'b',
            latex: 'B = -1',
            correct: true,
          },
          {
            id: 'c',
            latex: 'B = -5',
            correct: false,
            misconception:
              'Divide $5$ by $-5$: $B = \\frac{5}{-5} = -1$.',
          },
          {
            id: 'd',
            latex: 'B = \\frac{5}{7}',
            correct: false,
            misconception:
              'Evaluate at $s = -6$ (the root of $s + 6 = 0$), giving $-6 + 1 = -5$.',
          },
        ],
        lockedLabel: 'Partial Fractions',
        lockedResultLatex: '\\frac{5}{(s+1)(s+6)} = \\textcolor{#34D399}{\\frac{1}{s+1} - \\frac{1}{s+6}}',
        hint: 'At $s = -6$, the $A$ term vanishes leaving $5 = -5B$.',
      },
      {
        stepType: 'invert_terms',
        badge: 'Invert Term-by-Term',
        prompt: 'Apply $\\mathcal{L}^{-1}\\!\\left\\{\\frac{1}{s + a}\\right\\} = e^{-at}$ to $\\frac{1}{s+1} - \\frac{1}{s+6}$.',
        highlightLatex:
          '\\mathcal{L}^{-1}\\!\\left\\{\\textcolor{#22D3EE}{\\frac{1}{s + 1}} - \\textcolor{#F59E0B}{\\frac{1}{s + 6}}\\right\\}',
        options: [
          {
            id: 'a',
            latex: 'e^{t} - e^{6t}',
            correct: false,
            misconception:
              'Poles at $s = -1$ and $s = -6$ decay exponentially: $\\mathcal{L}^{-1}\\{\\frac{1}{s+a}\\} = e^{-at}$, not $e^{+at}$.',
          },
          {
            id: 'b',
            latex: 'e^{-t} + e^{-6t}',
            correct: false,
            misconception:
              'Keep the minus sign from $B = -1$! Notice $f(0) = e^0 - e^0 = 0$ for a strictly proper 2nd-order system.',
          },
          {
            id: 'c',
            latex: 'e^{-t} - e^{-6t}',
            correct: true,
          },
          {
            id: 'd',
            latex: '5e^{-t} - 5e^{-6t}',
            correct: false,
            misconception:
              'The factor $5$ was already absorbed when solving $A = 1$ and $B = -1$.',
          },
        ],
        lockedLabel: 'Inverse Transform',
        lockedResultLatex: '\\textcolor{#34D399}{f(t) = e^{-t} - e^{-6t}}',
        hint: 'Each $\\frac{1}{s + a}$ inverts directly to $e^{-at}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 5: SOLVING ODE IVPs VIA LAPLACE (2 problems)
  // =========================================================================
  {
    id: 'de13-lap-ivp1',
    tier: 'laplace-ivp',
    tierLabel: 'Laplace IVP',
    title: 'Laplace IVP: First-Order Servo Step',
    mechatronicsContext:
      'Laplace transforms turn $y\' + 3y = 6$ with nonzero initial speed $y(0) = 1$ into pure algebra in $s$, baking the initial condition straight into $Y(s)$ without ever solving for an arbitrary $C$.',
    expressionLatex: 'y\' + 3y = 6, \\quad y(0) = 1',
    finalAnswerLatex: 'y(t) = 2 - e^{-3t}',
    domain: [0, 2.5],
    initialConditions: { y0: 1 },
    verifyFn: (t) => 2 - Math.exp(-3 * t),
    verifyDerivFn: (t) => 3 * Math.exp(-3 * t),
    odeResidual: (_t, y, dy) => dy + 3 * y - 6,
    steps: [
      {
        stepType: 'transform_ode',
        badge: 'Transform ODE + IC',
        prompt: 'Take $\\mathcal{L}\\{\\cdot\\}$ of both sides of $y\' + 3y = 6$ using $\\mathcal{L}\\{y\'\\} = sY(s) - y(0)$ with $y(0) = 1$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\mathcal{L}\\{y\'\\}} + 3\\,\\mathcal{L}\\{y\\} = \\textcolor{#F59E0B}{\\mathcal{L}\\{6\\}}, \\quad y(0) = \\textcolor{#F59E0B}{1}',
        options: [
          {
            id: 'a',
            latex: '(sY - 1) + 3Y = 6',
            correct: false,
            misconception:
              'Don\'t forget to transform the constant $6$ on the right! $\\mathcal{L}\\{6\\} = \\frac{6}{s}$, not $6$.',
          },
          {
            id: 'b',
            latex: 'sY + 3Y = \\frac{6}{s}',
            correct: false,
            misconception:
              'You dropped the initial condition $-y(0) = -1$ from $\\mathcal{L}\\{y\'\\} = sY - y(0)$.',
          },
          {
            id: 'c',
            latex: '(sY + 1) + 3Y = \\frac{6}{s}',
            correct: false,
            misconception:
              'The derivative property SUBTRACTS $y(0)$: $\\mathcal{L}\\{y\'\\} = sY - y(0) = sY - 1$.',
          },
          {
            id: 'd',
            latex: '(sY - 1) + 3Y = \\frac{6}{s}',
            correct: true,
          },
        ],
        lockedLabel: 's-Domain Equation',
        lockedResultLatex: '\\textcolor{#22D3EE}{(sY - 1)} + 3Y = \\textcolor{#F59E0B}{\\frac{6}{s}}',
        hint: 'Use $\\mathcal{L}\\{y\'\\} = sY(s) - y(0)$ and $\\mathcal{L}\\{c\\} = \\frac{c}{s}$.',
      },
      {
        stepType: 'solve_Y',
        badge: 'Isolate Y(s)',
        prompt: 'Group $Y(s)$ on the left, move $-1$ to the right, and solve for $Y(s)$ as a single fraction.',
        highlightLatex:
          '(\\textcolor{#22D3EE}{s + 3})\\,Y(s) = \\textcolor{#F59E0B}{1 + \\frac{6}{s}} = \\frac{s + 6}{s}',
        options: [
          {
            id: 'a',
            latex: 'Y(s) = \\frac{s + 6}{s(s + 3)}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'Y(s) = \\frac{6}{s(s + 3)}',
            correct: false,
            misconception:
              'Moving $-1$ to the right adds $+1 = \\frac{s}{s}$ to $\\frac{6}{s}$, giving $\\frac{s + 6}{s}$.',
          },
          {
            id: 'c',
            latex: 'Y(s) = \\frac{7}{s(s + 3)}',
            correct: false,
            misconception:
              'Add $1 + \\frac{6}{s}$ using common denominator $s$: $\\frac{s}{s} + \\frac{6}{s} = \\frac{s + 6}{s}$, not $\\frac{7}{s}$.',
          },
          {
            id: 'd',
            latex: 'Y(s) = \\frac{s - 6}{s(s + 3)}',
            correct: false,
            misconception:
              'Both $+1$ and $+\\frac{6}{s}$ are positive on the right-hand side.',
          },
        ],
        lockedLabel: 'Solved Y(s)',
        lockedResultLatex: 'Y(s) = \\textcolor{#34D399}{\\frac{s + 6}{s(s + 3)}}',
        hint: 'Combine $1 + \\frac{6}{s} = \\frac{s+6}{s}$, then divide both sides by $(s + 3)$.',
      },
      {
        stepType: 'partial_fractions',
        badge: 'Partial Fractions',
        prompt: 'Split $Y(s) = \\frac{s + 6}{s(s + 3)} = \\frac{A}{s} + \\frac{B}{s + 3}$ using cover-up at $s = 0$ and $s = -3$.',
        highlightLatex:
          '\\frac{s + 6}{\\textcolor{#22D3EE}{s}(\\textcolor{#F59E0B}{s + 3})} = \\frac{A}{\\textcolor{#22D3EE}{s}} + \\frac{B}{\\textcolor{#F59E0B}{s + 3}}',
        options: [
          {
            id: 'a',
            latex: 'Y(s) = \\frac{2}{s} + \\frac{1}{s + 3}',
            correct: false,
            misconception:
              'Check at $s = -3$: $B = \\frac{-3 + 6}{-3} = \\frac{3}{-3} = -1$, not $+1$.',
          },
          {
            id: 'b',
            latex: 'Y(s) = \\frac{2}{s} - \\frac{1}{s + 3}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'Y(s) = \\frac{6}{s} - \\frac{5}{s + 3}',
            correct: false,
            misconception:
              'At $s = 0$, cover up $s$ to get $A = \\frac{0 + 6}{0 + 3} = 2$, not $6$.',
          },
          {
            id: 'd',
            latex: 'Y(s) = \\frac{1}{s} + \\frac{2}{s + 3}',
            correct: false,
            misconception:
              'Verify numerator: $1(s+3) + 2s = 3s + 3 \\neq s + 6$. Check $2(s+3) - 1(s) = s + 6$.',
          },
        ],
        lockedLabel: 'Expanded Y(s)',
        lockedResultLatex: 'Y(s) = \\textcolor{#34D399}{\\frac{2}{s} - \\frac{1}{s + 3}}',
        hint: 'At $s = 0$: $A = \\frac{6}{3} = 2$. At $s = -3$: $B = \\frac{-3+6}{-3} = -1$.',
      },
      {
        stepType: 'invert',
        badge: 'Inverse Laplace',
        prompt: 'Take the inverse Laplace transform of $Y(s) = \\frac{2}{s} - \\frac{1}{s + 3}$ to recover $y(t)$.',
        highlightLatex:
          'y(t) = \\mathcal{L}^{-1}\\!\\left\\{\\textcolor{#22D3EE}{\\frac{2}{s}} - \\textcolor{#F59E0B}{\\frac{1}{s + 3}}\\right\\}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 2t - e^{-3t}',
            correct: false,
            misconception:
              '$\\mathcal{L}^{-1}\\{\\frac{2}{s}\\} = 2$ (a constant step); $2t$ would require $\\frac{2}{s^2}$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 2 - e^{3t}',
            correct: false,
            misconception:
              'The pole $s + 3 = 0$ is at $s = -3$, giving decaying $e^{-3t}$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 2 - e^{-3t}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'y(t) = 2 - 3e^{-3t}',
            correct: false,
            misconception:
              'The residue $B = -1$ gives $-1\\cdot e^{-3t}$, so $y(0) = 2 - 1 = 1$.',
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 2 - e^{-3t}}',
        hint: 'Invert $\\frac{2}{s} \\to 2$ and $\\frac{1}{s+3} \\to e^{-3t}$.',
      },
    ],
  },

  {
    id: 'de14-lap-ivp2',
    tier: 'laplace-ivp',
    tierLabel: 'Laplace IVP',
    title: 'Laplace IVP: Undamped Harmonic Oscillator',
    mechatronicsContext:
      'A lossless LC tank or undamped MEMS resonator ($y\'\' + 4y = 0$) launched from $y(0) = 2$ with velocity $y\'(0) = 6$ oscillates cleanly at $\\omega = 2\\,\\text{rad/s}$ as $2\\cos(2t) + 3\\sin(2t)$.',
    expressionLatex: 'y\'\' + 4y = 0, \\quad y(0) = 2, \\; y\'(0) = 6',
    finalAnswerLatex: 'y(t) = 2\\cos(2t) + 3\\sin(2t)',
    domain: [0, 6.28],
    initialConditions: { y0: 2, dy0: 6 },
    verifyFn: (t) => 2 * Math.cos(2 * t) + 3 * Math.sin(2 * t),
    verifyDerivFn: (t) => -4 * Math.sin(2 * t) + 6 * Math.cos(2 * t),
    odeResidual: (_t, y, _dy, d2y) => d2y + 4 * y,
    steps: [
      {
        stepType: 'transform_ode2',
        badge: '2nd-Derivative Property',
        prompt: 'Apply $\\mathcal{L}\\{y\'\'\\} = s^2 Y - s\\,y(0) - y\'(0)$ to $y\'\' + 4y = 0$ with $y(0) = 2$ and $y\'(0) = 6$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\big(s^2 Y - s\\,y(0) - y\'(0)\\big)} + 4Y = 0, \\quad y(0)=\\textcolor{#F59E0B}{2}, \\; y\'(0)=\\textcolor{#F59E0B}{6}',
        options: [
          {
            id: 'a',
            latex: '(s^2 Y - 6s - 2) + 4Y = 0',
            correct: false,
            misconception:
              'You swapped the initial conditions! $y(0) = 2$ multiplies $s$, and $y\'(0) = 6$ is the constant term.',
          },
          {
            id: 'b',
            latex: '(s^2 Y - 2s - 6) + 4Y = 0',
            correct: true,
          },
          {
            id: 'c',
            latex: '(s^2 Y + 2s + 6) + 4Y = 0',
            correct: false,
            misconception:
              'Both initial-condition terms carry MINUS signs in $\\mathcal{L}\\{y\'\'\\} = s^2Y - s\\,y(0) - y\'(0)$.',
          },
          {
            id: 'd',
            latex: '(s^2 Y - 2 - 6) + 4Y = 0',
            correct: false,
            misconception:
              'Don\'t drop the $s$ multiplying $y(0)$! The initial position enters as $-s\\,y(0) = -2s$.',
          },
        ],
        lockedLabel: 's-Domain Equation',
        lockedResultLatex: '\\textcolor{#22D3EE}{(s^2 Y - 2s - 6)} + 4Y = 0',
        hint: 'Substitute $y(0) = 2$ and $y\'(0) = 6$ straight into $s^2Y - sy(0) - y\'(0)$.',
      },
      {
        stepType: 'solve_Y',
        badge: 'Solve & Split Y(s)',
        prompt: 'Solve $(s^2 + 4)Y = 2s + 6$ for $Y(s)$ and split into cosine and sine templates with $\\omega = 2$.',
        highlightLatex:
          'Y(s) = \\frac{\\textcolor{#22D3EE}{2s} + \\textcolor{#F59E0B}{6}}{s^2 + 4} = 2\\cdot\\frac{s}{s^2 + 2^2} + \\text{?}\\cdot\\frac{2}{s^2 + 2^2}',
        options: [
          {
            id: 'a',
            latex: 'Y(s) = 2\\,\\frac{s}{s^2 + 4} + 6\\,\\frac{2}{s^2 + 4}',
            correct: false,
            misconception:
              'Check the numerator: $6 \\cdot 2 = 12 \\neq 6$! Rewrite $6$ as $3 \\cdot 2$ so the sine template gets $\\omega = 2$.',
          },
          {
            id: 'b',
            latex: 'Y(s) = 2\\,\\frac{s}{s^2 + 4} + 3\\,\\frac{2}{s^2 + 4}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'Y(s) = 2\\,\\frac{s}{s^2 + 4} + \\frac{6}{s^2 + 2}',
            correct: false,
            misconception:
              'Keep the common denominator $s^2 + 4$ (where $\\omega^2 = 4$, so $\\omega = 2$).',
          },
          {
            id: 'd',
            latex: 'Y(s) = \\frac{2}{s + 2} + \\frac{6}{s - 2}',
            correct: false,
            misconception:
              '$s^2 + 4$ has imaginary roots $\\pm 2i$, not real factors $(s+2)(s-2)$!',
          },
        ],
        lockedLabel: 'Template Form',
        lockedResultLatex: 'Y(s) = \\textcolor{#22D3EE}{2\\,\\frac{s}{s^2 + 4}} + \\textcolor{#F59E0B}{3\\,\\frac{2}{s^2 + 4}}',
        hint: 'Factor $6 = 3 \\times 2$ so the second fraction matches $\\mathcal{L}\\{\\sin(2t)\\} = \\frac{2}{s^2 + 4}$.',
      },
      {
        stepType: 'invert',
        badge: 'Inverse Laplace',
        prompt: 'Invert both standard trigonometric terms to recover $y(t)$.',
        highlightLatex:
          'y(t) = 2\\,\\mathcal{L}^{-1}\\!\\left\\{\\textcolor{#22D3EE}{\\frac{s}{s^2 + 4}}\\right\\} + 3\\,\\mathcal{L}^{-1}\\!\\left\\{\\textcolor{#F59E0B}{\\frac{2}{s^2 + 4}}\\right\\}',
        options: [
          {
            id: 'a',
            latex: 'y(t) = 2\\cos(4t) + 3\\sin(4t)',
            correct: false,
            misconception:
              'Since $\\omega^2 = 4$, the angular frequency is $\\omega = \\sqrt{4} = 2$, not $4$.',
          },
          {
            id: 'b',
            latex: 'y(t) = 2\\cos(2t) + 6\\sin(2t)',
            correct: false,
            misconception:
              'Check $y\'(0)$: $6\\cdot 2 = 12 \\neq 6$! Remember $\\mathcal{L}^{-1}\\{\\frac{6}{s^2+4}\\} = 3\\sin(2t)$.',
          },
          {
            id: 'c',
            latex: 'y(t) = 2\\sin(2t) + 3\\cos(2t)',
            correct: false,
            misconception:
              'You swapped sine and cosine! $\\frac{s}{s^2+4} \\to \\cos(2t)$ and $\\frac{2}{s^2+4} \\to \\sin(2t)$.',
          },
          {
            id: 'd',
            latex: 'y(t) = 2\\cos(2t) + 3\\sin(2t)',
            correct: true,
          },
        ],
        lockedLabel: 'Particular Solution',
        lockedResultLatex: '\\textcolor{#34D399}{y(t) = 2\\cos(2t) + 3\\sin(2t)}',
        hint: 'Use $\\mathcal{L}^{-1}\\{\\frac{s}{s^2+\\omega^2}\\} = \\cos(\\omega t)$ and $\\mathcal{L}^{-1}\\{\\frac{\\omega}{s^2+\\omega^2}\\} = \\sin(\\omega t)$ with $\\omega = 2$.',
      },
    ],
  },
];
