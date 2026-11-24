/**
 * EIGENLAB — Integrals Paperless Step-by-Step Problem Bank
 * 14 multi-step calculus problems spanning 5 progressive mastery tiers:
 * Power & FTC, u-Substitution, Trigonometric & Half-Angle, Integration by Parts,
 * and Partial Fractions.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): u / primary factor / first partial fraction A / lower bound
 *  - Amber  (#F59E0B): dv / inner / secondary factor / partial fraction B / upper bound
 *  - Emerald(#34D399): Antiderivative / evaluated result
 */

export const INTEGRAL_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'basic', label: 'Power & FTC' },
  { id: 'usub', label: 'u-Sub' },
  { id: 'trig', label: 'Trig' },
  { id: 'ibp', label: 'By Parts' },
  { id: 'partial', label: 'Partial Frac' },
];

export const INTEGRAL_PROBLEMS = [
  // =========================================================================
  // TIER 1: POWER & FTC
  // =========================================================================
  {
    id: 'i1-power-poly',
    tier: 'basic',
    tierLabel: 'Power & FTC',
    title: 'Polynomial Velocity to Position',
    mechatronicsContext:
      'Integrating a quadratic motor velocity profile $v(t) = 6t^2 - 4t + 5$ recovers the exact cubic displacement trajectory $s(t)$ up to the initial encoder offset $C$.',
    expressionLatex: '\\int (6x^2 - 4x + 5)\\,dx',
    finalAnswerLatex: '\\int (6x^2 - 4x + 5)\\,dx = 2x^3 - 2x^2 + 5x + C',
    domain: [-2, 2.5],
    verifyFn: (x) => 6 * x ** 2 - 4 * x + 5,
    verifyAntiderivFn: (x) => 2 * x ** 3 - 2 * x ** 2 + 5 * x,
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Identify Rule',
        prompt: 'Which integration strategy applies to a sum and difference of polynomial power terms?',
        highlightLatex:
          '\\int \\left(\\textcolor{#22D3EE}{6x^2} - \\textcolor{#22D3EE}{4x} + \\textcolor{#F59E0B}{5}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\int u\\,dv = uv - \\int v\\,du',
            correct: false,
            misconception:
              'Integration by Parts is for products of dissimilar functions—this integrand is a simple sum of powers.',
          },
          {
            id: 'b',
            latex: '\\text{Linearity + Reverse Power Rule: } \\int c\\,x^n\\,dx = c\\,\\frac{x^{n+1}}{n+1} + C',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\int \\frac{1}{u}\\,du = \\ln|u| + C',
            correct: false,
            misconception:
              'There is no $x^{-1}$ or rational denominator here; every term has a non-negative integer exponent.',
          },
          {
            id: 'd',
            latex: '\\frac{d}{dx}(c\\,x^n) = c\\,n\\,x^{n-1}',
            correct: false,
            misconception:
              'That is the differentiation power rule! For integration we raise the exponent by $1$ and divide by the new exponent.',
          },
        ],
        lockedLabel: 'Rule',
        lockedResultLatex:
          '\\text{Linearity + Reverse Power: } \\int c\\,x^n\\,dx = c\\,\\frac{x^{n+1}}{n+1} + C',
        hint: 'Integrals distribute across sums and differences, and each $x^n$ steps up to $\\frac{x^{n+1}}{n+1}$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Power Terms',
        prompt: 'Integrate the quadratic and linear terms: $\\int (6x^2 - 4x)\\,dx$.',
        highlightLatex:
          '\\int \\left(\\textcolor{#22D3EE}{6x^{\\textcolor{#F59E0B}{2}}} - \\textcolor{#22D3EE}{4x^{\\textcolor{#F59E0B}{1}}}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '12x - 4',
            correct: false,
            misconception:
              'You differentiated instead of integrating! Raise each power by $1$ and divide by the new exponent.',
          },
          {
            id: 'b',
            latex: '6x^3 - 4x^2',
            correct: false,
            misconception:
              'You raised the exponents, but forgot to divide by the new exponents ($6/3 = 2$ and $4/2 = 2$).',
          },
          {
            id: 'c',
            latex: '2x^3 - 2x^2',
            correct: true,
          },
          {
            id: 'd',
            latex: '3x^3 - 2x^2',
            correct: false,
            misconception:
              'Check the first coefficient: raising $x^2 \\to x^3$ divides $6$ by $3$, giving $2x^3$ rather than $3x^3$.',
          },
        ],
        lockedLabel: 'Power Terms',
        lockedResultLatex: '\\int (6x^2 - 4x)\\,dx = \\textcolor{#34D399}{2x^3 - 2x^2}',
        hint: 'Compute $6\\cdot\\frac{x^3}{3} - 4\\cdot\\frac{x^2}{2}$ and simplify both fractions.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Constant Term',
        prompt: 'Now integrate the constant term: $\\int 5\\,dx$.',
        highlightLatex: '\\int \\textcolor{#F59E0B}{5}\\,dx',
        options: [
          {
            id: 'a',
            latex: '5x',
            correct: true,
          },
          {
            id: 'b',
            latex: '0',
            correct: false,
            misconception:
              'The derivative of $5$ is $0$, but the antiderivative of a constant $5$ is the linear ramp $5x$.',
          },
          {
            id: 'c',
            latex: '5',
            correct: false,
            misconception:
              'Check by differentiating: $\\frac{d}{dx}(5) = 0 \\neq 5$, whereas $\\frac{d}{dx}(5x) = 5$.',
          },
          {
            id: 'd',
            latex: '\\frac{5}{2}x^2',
            correct: false,
            misconception:
              'Since $5 = 5x^0$, adding $1$ to the exponent gives $x^1$, not $x^2$.',
          },
        ],
        lockedLabel: 'Constant',
        lockedResultLatex: '\\int 5\\,dx = \\textcolor{#34D399}{5x}',
        hint: 'What function has constant slope $5$ everywhere?',
      },
      {
        stepType: 'assemble',
        badge: 'Combine + C',
        prompt: 'Assemble the full indefinite antiderivative, including the constant of integration.',
        highlightLatex:
          '\\textcolor{#34D399}{(2x^3 - 2x^2)} + \\textcolor{#34D399}{5x} + \\textcolor{#F59E0B}{C}',
        options: [
          {
            id: 'a',
            latex: '2x^3 - 2x^2 + 5x',
            correct: false,
            misconception:
              'Indefinite integrals represent an entire family of vertical shifts—always include $+ C$.',
          },
          {
            id: 'b',
            latex: '2x^3 + 2x^2 + 5x + C',
            correct: false,
            misconception:
              'Watch the sign on the middle term: $-4x$ integrates to $-2x^2$, keeping the minus sign.',
          },
          {
            id: 'c',
            latex: '12x - 4 + C',
            correct: false,
            misconception:
              'That is the derivative of the integrand; combine the antiderivative pieces from the ledger above.',
          },
          {
            id: 'd',
            latex: '2x^3 - 2x^2 + 5x + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{2x^3 - 2x^2 + 5x + C}',
        hint: 'Sum the locked antiderivative terms and append $+ C$ for the indefinite family.',
      },
    ],
  },

  {
    id: 'i2-fractional-neg',
    tier: 'basic',
    tierLabel: 'Power & FTC',
    title: 'Roots & Inverse-Square Powers',
    mechatronicsContext:
      'Computing work done against an inverse-square magnetic force ($x^{-2}$) combined with a non-linear fluid drag term ($\\sqrt{x}$) relies on rewriting radicals and reciprocals as fractional and negative exponents.',
    expressionLatex: '\\int \\left(3\\sqrt{x} + \\frac{2}{x^2}\\right)\\,dx',
    finalAnswerLatex:
      '\\int \\left(3\\sqrt{x} + \\frac{2}{x^2}\\right)\\,dx = 2x^{3/2} - \\frac{2}{x} + C',
    domain: [0.5, 4],
    verifyFn: (x) => 3 * Math.sqrt(x) + 2 / (x * x),
    verifyAntiderivFn: (x) => 2 * Math.pow(x, 1.5) - 2 / x,
    steps: [
      {
        stepType: 'decompose',
        badge: 'Rewrite Powers',
        prompt: 'Rewrite both $\\sqrt{x}$ and $\\frac{2}{x^2}$ in pure exponent form $c\\,x^n$.',
        highlightLatex:
          '\\int \\left(\\textcolor{#22D3EE}{3\\sqrt{x}} + \\textcolor{#F59E0B}{\\frac{2}{x^2}}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\int \\left(3x^{1/2} + 2x^{-2}\\right)\\,dx',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\int \\left(3x^{2} + 2x^{-2}\\right)\\,dx',
            correct: false,
            misconception:
              'A square root is a half-power: $\\sqrt{x} = x^{1/2}$, not $x^2$.',
          },
          {
            id: 'c',
            latex: '\\int \\left(3x^{1/2} - 2x^{2}\\right)\\,dx',
            correct: false,
            misconception:
              'Moving $x^2$ to the numerator negates its exponent ($x^{-2}$), not the sign in front of the coefficient.',
          },
          {
            id: 'd',
            latex: '\\int \\left(3x^{-1/2} + 2x^{-2}\\right)\\,dx',
            correct: false,
            misconception:
              '$\\sqrt{x}$ is in the numerator, so its exponent is positive $+\\frac{1}{2}$, not $-\\frac{1}{2}$.',
          },
        ],
        lockedLabel: 'Power Form',
        lockedResultLatex: '\\int \\left(\\textcolor{#22D3EE}{3x^{1/2}} + \\textcolor{#F59E0B}{2x^{-2}}\\right)\\,dx',
        hint: 'Recall $\\sqrt{x} = x^{1/2}$ and $\\frac{1}{x^k} = x^{-k}$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Fractional Power',
        prompt: 'Apply the reverse power rule to $\\int 3x^{1/2}\\,dx$.',
        highlightLatex: '\\int \\textcolor{#22D3EE}{3x^{\\textcolor{#F59E0B}{1/2}}}\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\frac{3}{2}x^{-1/2}',
            correct: false,
            misconception:
              'That is the derivative of $3x^{1/2}$. For integration, add $1$ to $\\frac{1}{2}$ to get $\\frac{3}{2}$.',
          },
          {
            id: 'b',
            latex: '\\frac{9}{2}x^{3/2}',
            correct: false,
            misconception:
              'Dividing by $\\frac{3}{2}$ multiplies by its reciprocal $\\frac{2}{3}$: $3 \\cdot \\frac{2}{3} = 2$, not $\\frac{9}{2}$.',
          },
          {
            id: 'c',
            latex: '2x^{3/2}',
            correct: true,
          },
          {
            id: 'd',
            latex: '3x^{3/2}',
            correct: false,
            misconception:
              'Remember to divide by the new exponent $\\frac{3}{2}$ after raising the power.',
          },
        ],
        lockedLabel: 'Root Term',
        lockedResultLatex: '\\int 3x^{1/2}\\,dx = 3\\cdot\\frac{2}{3}x^{3/2} = \\textcolor{#34D399}{2x^{3/2}}',
        hint: 'Add $1$ to $\\frac{1}{2}$ to get $\\frac{3}{2}$, then multiply $3$ by the reciprocal $\\frac{2}{3}$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Negative Power',
        prompt: 'Now integrate the negative power term: $\\int 2x^{-2}\\,dx$.',
        highlightLatex: '\\int \\textcolor{#F59E0B}{2x^{-2}}\\,dx',
        options: [
          {
            id: 'a',
            latex: '2\\ln|x|',
            correct: false,
            misconception:
              'Only $x^{-1}$ integrates to $\\ln|x|$. For $n = -2 \\neq -1$, use the reverse power rule.',
          },
          {
            id: 'b',
            latex: '-\\frac{2}{x}',
            correct: true,
          },
          {
            id: 'c',
            latex: '-\\frac{2}{3x^3}',
            correct: false,
            misconception:
              'Careful with negative addition: $-2 + 1 = -1$, not $-3$!',
          },
          {
            id: 'd',
            latex: '\\frac{2}{x}',
            correct: false,
            misconception:
              'Dividing by the new exponent $-1$ flips the sign to negative: $\\frac{2x^{-1}}{-1} = -\\frac{2}{x}$.',
          },
        ],
        lockedLabel: 'Inverse Term',
        lockedResultLatex: '\\int 2x^{-2}\\,dx = \\frac{2x^{-1}}{-1} = \\textcolor{#34D399}{-\\frac{2}{x}}',
        hint: 'Step the exponent up by $+1$: $-2 + 1 = -1$, then divide by $-1$.',
      },
      {
        stepType: 'assemble',
        badge: 'Final Antiderivative',
        prompt: 'Combine both integrated terms with $+ C$.',
        highlightLatex:
          '\\textcolor{#34D399}{2x^{3/2}} + \\left(\\textcolor{#34D399}{-\\frac{2}{x}}\\right) + C',
        options: [
          {
            id: 'a',
            latex: '2x^{3/2} + \\frac{2}{x} + C',
            correct: false,
            misconception:
              'Check the sign of the second term: dividing by $-1$ produced $-\\frac{2}{x}$.',
          },
          {
            id: 'b',
            latex: '\\frac{3}{2}x^{3/2} - \\frac{2}{x} + C',
            correct: false,
            misconception:
              'Remember $3 \\div \\frac{3}{2} = 2$, so the leading coefficient is $2$.',
          },
          {
            id: 'c',
            latex: '2x^{3/2} - 2\\ln|x| + C',
            correct: false,
            misconception:
              'The second term was $2x^{-2}$, which integrated to $-\\frac{2}{x}$, not $-2\\ln|x|$.',
          },
          {
            id: 'd',
            latex: '2x^{3/2} - \\frac{2}{x} + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{2x^{3/2} - \\frac{2}{x} + C}',
        hint: 'Combine $2x^{3/2}$ and $-\\frac{2}{x}$, then append $+ C$.',
      },
    ],
  },

  {
    id: 'i3-definite-ftc',
    tier: 'basic',
    tierLabel: 'Power & FTC',
    title: 'Definite Integral via FTC',
    mechatronicsContext:
      'Evaluating a definite integral over $[0, 2]$ computes exact total displacement or accumulated charge in an actuator burst without needing $+C$—the upper minus lower antiderivative cancels any offset.',
    expressionLatex: '\\int_{0}^{2} (3x^2 + 2x)\\,dx',
    finalAnswerLatex: '\\int_{0}^{2} (3x^2 + 2x)\\,dx = \\Big[x^3 + x^2\\Big]_{0}^{2} = 12',
    domain: [0, 2.2],
    definiteBounds: [0, 2],
    definiteValue: 12,
    verifyFn: (x) => 3 * x ** 2 + 2 * x,
    verifyAntiderivFn: (x) => x ** 3 + x ** 2,
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Fundamental Theorem',
        prompt: 'How does the Fundamental Theorem of Calculus evaluate a definite integral $\\int_a^b f(x)\\,dx$?',
        highlightLatex:
          '\\int_{\\textcolor{#22D3EE}{0}}^{\\textcolor{#F59E0B}{2}} (3x^2 + 2x)\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\int_a^b f(x)\\,dx = f(b) - f(a)',
            correct: false,
            misconception:
              'Do not plug bounds directly into $f(x)$—you must first find an antiderivative $F(x)$ and compute $F(b) - F(a)$.',
          },
          {
            id: 'b',
            latex: '\\int_a^b f(x)\\,dx = F(a) - F(b)',
            correct: false,
            misconception:
              'The order matters! Always subtract the lower bound from the upper bound: $F(\\text{top}) - F(\\text{bottom})$.',
          },
          {
            id: 'c',
            latex: '\\int_a^b f(x)\\,dx = F(b) - F(a) \\quad (F\' = f)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\int_a^b f(x)\\,dx = F(b) + F(a)',
            correct: false,
            misconception:
              'The net accumulation from $a$ to $b$ is the difference $F(b) - F(a)$, not the sum.',
          },
        ],
        lockedLabel: 'FTC Formula',
        lockedResultLatex: '\\int_0^2 f(x)\\,dx = \\textcolor{#34D399}{F(2) - F(0)}',
        hint: 'Find an antiderivative $F(x)$, evaluate at the upper limit $b=2$, and subtract its value at the lower limit $a=0$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Find F(x)',
        prompt: 'Find the antiderivative $F(x)$ of $3x^2 + 2x$.',
        highlightLatex: 'F(x) = \\int (\\textcolor{#22D3EE}{3x^2} + \\textcolor{#F59E0B}{2x})\\,dx',
        options: [
          {
            id: 'a',
            latex: 'F(x) = x^3 + x^2',
            correct: true,
          },
          {
            id: 'b',
            latex: 'F(x) = 6x + 2',
            correct: false,
            misconception:
              '$6x + 2$ is the derivative $f\'(x)$. Integrate upward to get powers $x^3$ and $x^2$.',
          },
          {
            id: 'c',
            latex: 'F(x) = 3x^3 + 2x^2',
            correct: false,
            misconception:
              'Divide each coefficient by its new exponent: $\\frac{3}{3} = 1$ and $\\frac{2}{2} = 1$.',
          },
          {
            id: 'd',
            latex: 'F(x) = x^3 + 2x^2',
            correct: false,
            misconception:
              'Check the second term: $\\int 2x\\,dx = 2\\cdot\\frac{x^2}{2} = x^2$, not $2x^2$.',
          },
        ],
        lockedLabel: 'Antiderivative',
        lockedResultLatex: 'F(x) = \\textcolor{#34D399}{x^3 + x^2}',
        hint: 'Apply reverse power rule to each term: $\\frac{3x^3}{3} + \\frac{2x^2}{2}$.',
      },
      {
        stepType: 'evaluate_bounds',
        badge: 'Evaluate Bounds',
        prompt: 'Substitute the upper bound $x = 2$ and lower bound $x = 0$ into $F(x) = x^3 + x^2$.',
        highlightLatex:
          '\\Big[x^3 + x^2\\Big]_{\\textcolor{#22D3EE}{0}}^{\\textcolor{#F59E0B}{2}} = F(\\textcolor{#F59E0B}{2}) - F(\\textcolor{#22D3EE}{0})',
        options: [
          {
            id: 'a',
            latex: 'F(2) = 16,\\quad F(0) = 0',
            correct: false,
            misconception:
              'Check the cube carefully: $2^3 = 8$ and $2^2 = 4$, so $8 + 4 = 12$, not $16$.',
          },
          {
            id: 'b',
            latex: 'F(2) = 10,\\quad F(0) = 0',
            correct: false,
            misconception:
              'Compute $2^3 = 8$ (not $6$) plus $2^2 = 4$.',
          },
          {
            id: 'c',
            latex: 'F(2) = 12,\\quad F(0) = 1',
            correct: false,
            misconception:
              'At $x = 0$, $0^3 + 0^2 = 0$, not $1$.',
          },
          {
            id: 'd',
            latex: 'F(2) = 2^3 + 2^2 = 12,\\quad F(0) = 0',
            correct: true,
          },
        ],
        lockedLabel: 'Endpoints',
        lockedResultLatex: 'F(2) = \\textcolor{#F59E0B}{12},\\quad F(0) = \\textcolor{#22D3EE}{0}',
        hint: 'Evaluate $2^3 + 2^2 = 8 + 4$ for the upper limit and $0^3 + 0^2$ for the lower limit.',
      },
      {
        stepType: 'assemble',
        badge: 'Exact Area',
        prompt: 'Compute the final definite integral value $F(2) - F(0)$.',
        highlightLatex:
          '\\int_0^2 (3x^2 + 2x)\\,dx = \\textcolor{#F59E0B}{12} - \\textcolor{#22D3EE}{0}',
        options: [
          {
            id: 'a',
            latex: '12 + C',
            correct: false,
            misconception:
              'Definite integrals produce a single exact number—the $+C$ cancels out in $(F(2)+C) - (F(0)+C)$.',
          },
          {
            id: 'b',
            latex: '12',
            correct: true,
          },
          {
            id: 'c',
            latex: '-12',
            correct: false,
            misconception:
              'Since $3x^2 + 2x \\ge 0$ on $[0, 2]$, the accumulated area must be positive: $F(2) - F(0) = +12$.',
          },
          {
            id: 'd',
            latex: '8',
            correct: false,
            misconception:
              'Do not forget the $+2^2 = 4$ contribution alongside $2^3 = 8$.',
          },
        ],
        lockedLabel: 'Definite Value',
        lockedResultLatex: '\\int_0^2 (3x^2 + 2x)\\,dx = \\textcolor{#34D399}{12}',
        hint: 'Subtract the lower value from the upper value; definite integrals have no $+C$.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: u-SUBSTITUTION
  // =========================================================================
  {
    id: 'i4-usub-power',
    tier: 'usub',
    tierLabel: 'u-Sub',
    title: 'Exact Chain-Rule Reversal',
    mechatronicsContext:
      'Nonlinear spring potential energy integrals often carry an inner energy expression raised to a power multiplied directly by its derivative—the signature pattern of $u$-substitution.',
    expressionLatex: '\\int 2x(x^2 + 3)^4\\,dx',
    finalAnswerLatex: '\\int 2x(x^2 + 3)^4\\,dx = \\frac{1}{5}(x^2 + 3)^5 + C',
    domain: [-1.5, 1.5],
    verifyFn: (x) => 2 * x * Math.pow(x * x + 3, 4),
    verifyAntiderivFn: (x) => 0.2 * Math.pow(x * x + 3, 5),
    steps: [
      {
        stepType: 'choose_u',
        badge: 'Choose u',
        prompt: 'Pick the inner substitution $u$ whose derivative already appears as a factor outside.',
        highlightLatex:
          '\\int \\textcolor{#F59E0B}{2x}\\big(\\textcolor{#22D3EE}{x^2 + 3}\\big)^4\\,dx',
        options: [
          {
            id: 'a',
            latex: 'u = 2x',
            correct: false,
            misconception:
              'Setting $u = 2x$ leaves $(x^2+3)^4$ unsimplified; instead pick the expression nested inside the $4$th power.',
          },
          {
            id: 'b',
            latex: 'u = (x^2 + 3)^4',
            correct: false,
            misconception:
              'Include only the inner base $x^2 + 3$ (not the outer exponent $4$) so $du$ matches $2x\\,dx$.',
          },
          {
            id: 'c',
            latex: 'u = x^2 + 3',
            correct: true,
          },
          {
            id: 'd',
            latex: 'u = x^4',
            correct: false,
            misconception:
              'Look inside the parentheses: the composite base is $x^2 + 3$.',
          },
        ],
        lockedLabel: 'Choose u',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x^2 + 3}',
        hint: 'Choose the inside of the parentheses so its derivative cancels the $2x$ outside.',
      },
      {
        stepType: 'compute_du',
        badge: 'Compute du',
        prompt: 'Differentiate $u = x^2 + 3$ to express the differential $du$.',
        highlightLatex: 'u = \\textcolor{#22D3EE}{x^2 + 3} \\implies du = \\text{?}',
        options: [
          {
            id: 'a',
            latex: 'du = 2x\\,dx',
            correct: true,
          },
          {
            id: 'b',
            latex: 'du = (2x + 3)\\,dx',
            correct: false,
            misconception:
              'The constant $+3$ differentiates to $0$, leaving just $2x\\,dx$.',
          },
          {
            id: 'c',
            latex: 'du = x\\,dx',
            correct: false,
            misconception:
              'Remember the power rule brings down the exponent $2$: $\\frac{d}{dx}(x^2) = 2x$.',
          },
          {
            id: 'd',
            latex: 'du = \\frac{1}{3}x^3\\,dx',
            correct: false,
            misconception:
              'To find $du$ from $u$, differentiate $u$ rather than integrating it.',
          },
        ],
        lockedLabel: 'Differential',
        lockedResultLatex: '\\textcolor{#F59E0B}{du = 2x\\,dx}',
        hint: 'Take $\\frac{du}{dx} = 2x$ and multiply through by $dx$.',
      },
      {
        stepType: 'rewrite_integrate',
        badge: 'Integrate in u',
        prompt: 'Substitute $u$ and $du$ into the integral and evaluate $\\int u^4\\,du$.',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{u}^4\\,\\textcolor{#F59E0B}{du}',
        options: [
          {
            id: 'a',
            latex: '4u^3 + C',
            correct: false,
            misconception:
              '$4u^3$ is the derivative of $u^4$. Integrate upward by adding $1$ to the exponent.',
          },
          {
            id: 'b',
            latex: '\\frac{1}{5}u^5 + C',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u^5 + C',
            correct: false,
            misconception:
              'Do not forget to divide by the new exponent $5$.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{4}u^5 + C',
            correct: false,
            misconception:
              'Divide by the new exponent $4 + 1 = 5$, not the original exponent $4$.',
          },
        ],
        lockedLabel: 'u-Integral',
        lockedResultLatex: '\\int u^4\\,du = \\textcolor{#34D399}{\\frac{1}{5}u^5 + C}',
        hint: 'Use the reverse power rule on $u^4$: raise exponent $4 \\to 5$ and divide by $5$.',
      },
      {
        stepType: 'back_substitute',
        badge: 'Back-Substitute',
        prompt: 'Replace $u$ with $x^2 + 3$ to return to the original variable $x$.',
        highlightLatex:
          '\\frac{1}{5}\\big(\\textcolor{#22D3EE}{u}\\big)^5 + C, \\quad \\textcolor{#22D3EE}{u = x^2 + 3}',
        options: [
          {
            id: 'a',
            latex: '\\frac{2x}{5}(x^2 + 3)^5 + C',
            correct: false,
            misconception:
              'The factor $2x$ was completely absorbed into $du = 2x\\,dx$—do not re-multiply by $2x$!',
          },
          {
            id: 'b',
            latex: '\\frac{1}{5}(x^2 + 3)^4 + C',
            correct: false,
            misconception:
              'Keep the integrated exponent $5$, not the original exponent $4$.',
          },
          {
            id: 'c',
            latex: '\\frac{1}{5}(x^2 + 3)^5 + C',
            correct: true,
          },
          {
            id: 'd',
            latex: '(x^2 + 3)^5 + C',
            correct: false,
            misconception:
              'Keep the leading $\\frac{1}{5}$ factor so differentiating brings down $5$ to cancel it.',
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{1}{5}(x^2 + 3)^5 + C}',
        hint: 'Substitute $x^2 + 3$ directly into $\\frac{1}{5}u^5 + C$.',
      },
    ],
  },

  {
    id: 'i5-usub-exp',
    tier: 'usub',
    tierLabel: 'u-Sub',
    title: 'Gaussian-Scaled Exponential',
    mechatronicsContext:
      'Expected-value integrals in Kalman filters and Gaussian sensor noise models frequently take the form $\\int x\\,e^{x^2}\\,dx$—balancing a constant factor of $\\frac{1}{2}$ makes them instant.',
    expressionLatex: '\\int x\\,e^{x^2}\\,dx',
    finalAnswerLatex: '\\int x\\,e^{x^2}\\,dx = \\frac{1}{2}e^{x^2} + C',
    domain: [-1.3, 1.3],
    verifyFn: (x) => x * Math.exp(x * x),
    verifyAntiderivFn: (x) => 0.5 * Math.exp(x * x),
    steps: [
      {
        stepType: 'choose_u',
        badge: 'Choose u',
        prompt: 'Which substitution $u$ simplifies the nested exponential $e^{x^2}$?',
        highlightLatex:
          '\\int \\textcolor{#F59E0B}{x}\\,e^{\\textcolor{#22D3EE}{x^2}}\\,dx',
        options: [
          {
            id: 'a',
            latex: 'u = x',
            correct: false,
            misconception:
              'Substituting $u = x$ only renames the variable without simplifying $e^{x^2}$.',
          },
          {
            id: 'b',
            latex: 'u = x^2',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u = e^x',
            correct: false,
            misconception:
              'Notice $e^{x^2} \\neq (e^x)^2$! Choose the exponent $x^2$ as $u$.',
          },
          {
            id: 'd',
            latex: 'u = x\\,e^{x^2}',
            correct: false,
            misconception:
              'Choosing the entire integrand makes $du$ more complicated instead of simpler.',
          },
        ],
        lockedLabel: 'Choose u',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x^2}',
        hint: 'Pick the exponent of $e$ because its derivative is proportional to the outside factor $x$.',
      },
      {
        stepType: 'compute_du',
        badge: 'Balance du',
        prompt: 'Since $u = x^2$, compute $du$ and solve for the remaining factor $x\\,dx$.',
        highlightLatex:
          'du = 2x\\,dx \\implies \\textcolor{#F59E0B}{x\\,dx} = \\text{?}',
        options: [
          {
            id: 'a',
            latex: 'x\\,dx = 2\\,du',
            correct: false,
            misconception:
              'To isolate $x\\,dx$ from $du = 2x\\,dx$, divide both sides by $2$ rather than multiplying.',
          },
          {
            id: 'b',
            latex: 'x\\,dx = du',
            correct: false,
            misconception:
              'Do not drop the factor of $2$ from $\\frac{d}{dx}(x^2) = 2x$!',
          },
          {
            id: 'c',
            latex: 'x\\,dx = \\frac{1}{2}\\,du',
            correct: true,
          },
          {
            id: 'd',
            latex: 'x\\,dx = -\\frac{1}{2}\\,du',
            correct: false,
            misconception:
              'The derivative of $+x^2$ is positive $+2x$, so no minus sign enters.',
          },
        ],
        lockedLabel: 'Balance du',
        lockedResultLatex: '\\textcolor{#F59E0B}{x\\,dx = \\frac{1}{2}\\,du}',
        hint: 'Divide both sides of $du = 2x\\,dx$ by $2$.',
      },
      {
        stepType: 'rewrite_integrate',
        badge: 'Integrate in u',
        prompt: 'Rewrite the integral in terms of $u$ and evaluate.',
        highlightLatex:
          '\\textcolor{#F59E0B}{\\frac{1}{2}}\\int e^{\\textcolor{#22D3EE}{u}}\\,du',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{2}e^u + C',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\frac{1}{2}\\frac{e^{u+1}}{u+1} + C',
            correct: false,
            misconception:
              'The reverse power rule applies to $u^n$, not $e^u$. The exponential $e^u$ is its own antiderivative!',
          },
          {
            id: 'c',
            latex: '2e^u + C',
            correct: false,
            misconception:
              'The balancing constant pulled outside the integral is $\\frac{1}{2}$, not $2$.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{2}u\\,e^u + C',
            correct: false,
            misconception:
              '$\\int e^u\\,du = e^u + C$ directly—no extra factor of $u$ appears.',
          },
        ],
        lockedLabel: 'u-Integral',
        lockedResultLatex: '\\frac{1}{2}\\int e^u\\,du = \\textcolor{#34D399}{\\frac{1}{2}e^u + C}',
        hint: 'Pull $\\frac{1}{2}$ outside and use $\\int e^u\\,du = e^u + C$.',
      },
      {
        stepType: 'back_substitute',
        badge: 'Back-Substitute',
        prompt: 'Substitute $u = x^2$ back to obtain the final antiderivative.',
        highlightLatex:
          '\\frac{1}{2}e^{\\textcolor{#22D3EE}{u}} + C, \\quad \\textcolor{#22D3EE}{u = x^2}',
        options: [
          {
            id: 'a',
            latex: 'e^{x^2} + C',
            correct: false,
            misconception:
              'Check by differentiating: $(e^{x^2})\' = 2x\\,e^{x^2}$, which is twice too large. Keep the $\\frac{1}{2}$!',
          },
          {
            id: 'b',
            latex: '\\frac{1}{2}x^2 e^{x^2} + C',
            correct: false,
            misconception:
              'The outside $x$ was consumed by $x\\,dx = \\frac{1}{2}du$; only the exponent receives $x^2$.',
          },
          {
            id: 'c',
            latex: '\\frac{1}{2}e^{2x} + C',
            correct: false,
            misconception:
              'Remember $u = x^2$, not $2x$.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{2}e^{x^2} + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{1}{2}e^{x^2} + C}',
        hint: 'Replace $u$ in the exponent with $x^2$.',
      },
    ],
  },

  {
    id: 'i6-usub-log',
    tier: 'usub',
    tierLabel: 'u-Sub',
    title: 'Logarithmic Derivative Pattern',
    mechatronicsContext:
      'Whenever a transfer function or loss ratio has the exact form $\\frac{u\'(x)}{u(x)}$, integrating yields a clean log-magnitude response $\\ln|u(x)|$—fundamental to Bode gain plots and cross-entropy.',
    expressionLatex: '\\int \\frac{2x + 1}{x^2 + x + 4}\\,dx',
    finalAnswerLatex: '\\int \\frac{2x + 1}{x^2 + x + 4}\\,dx = \\ln(x^2 + x + 4) + C',
    domain: [-3, 3],
    verifyFn: (x) => (2 * x + 1) / (x * x + x + 4),
    verifyAntiderivFn: (x) => Math.log(x * x + x + 4),
    steps: [
      {
        stepType: 'choose_u',
        badge: 'Spot u\'/u',
        prompt: 'Notice the numerator relates directly to the denominator. Choose $u$.',
        highlightLatex:
          '\\int \\frac{\\textcolor{#F59E0B}{2x + 1}}{\\textcolor{#22D3EE}{x^2 + x + 4}}\\,dx',
        options: [
          {
            id: 'a',
            latex: 'u = 2x + 1',
            correct: false,
            misconception:
              'Differentiating the numerator gives $2$, which does not eliminate the quadratic denominator.',
          },
          {
            id: 'b',
            latex: 'u = x^2 + x + 4',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u = x^2',
            correct: false,
            misconception:
              'Take the entire denominator $x^2 + x + 4$ so its derivative captures both $2x$ and $+1$.',
          },
          {
            id: 'd',
            latex: 'u = \\frac{1}{x^2 + x + 4}',
            correct: false,
            misconception:
              'Setting $u$ to the denominator itself (not its reciprocal) turns the integral cleanly into $\\int \\frac{1}{u}\\,du$.',
          },
        ],
        lockedLabel: 'Choose u',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x^2 + x + 4}',
        hint: 'Try setting $u$ equal to the entire denominator and check its derivative.',
      },
      {
        stepType: 'compute_du',
        badge: 'Compute du',
        prompt: 'Compute the differential $du$ for $u = x^2 + x + 4$.',
        highlightLatex: 'u = \\textcolor{#22D3EE}{x^2 + x + 4} \\implies du = \\text{?}',
        options: [
          {
            id: 'a',
            latex: 'du = (2x + 4)\\,dx',
            correct: false,
            misconception:
              'Differentiate term by term: $(x)\' = 1$ and $(4)\' = 0$, giving $2x + 1$, not $2x + 4$.',
          },
          {
            id: 'b',
            latex: 'du = 2x\\,dx',
            correct: false,
            misconception:
              'Do not forget the linear $+x$ term, whose derivative is $+1$.',
          },
          {
            id: 'c',
            latex: 'du = (2x + 1)\\,dx',
            correct: true,
          },
          {
            id: 'd',
            latex: 'du = (x + 1)\\,dx',
            correct: false,
            misconception:
              'The derivative of $x^2$ is $2x$, not $x$.',
          },
        ],
        lockedLabel: 'Differential',
        lockedResultLatex: '\\textcolor{#F59E0B}{du = (2x + 1)\\,dx}',
        hint: 'Differentiate $x^2 + x + 4$ term-by-term; it matches the entire numerator!',
      },
      {
        stepType: 'rewrite_integrate',
        badge: 'Log Integral',
        prompt: 'Evaluate the transformed integral $\\int \\frac{1}{u}\\,du$.',
        highlightLatex: '\\int \\frac{\\textcolor{#F59E0B}{du}}{\\textcolor{#22D3EE}{u}}',
        options: [
          {
            id: 'a',
            latex: '-\\frac{1}{u^2} + C',
            correct: false,
            misconception:
              '$-\\frac{1}{u^2}$ is the derivative of $\\frac{1}{u}$, not its antiderivative.',
          },
          {
            id: 'b',
            latex: '\\frac{u^0}{0} + C',
            correct: false,
            misconception:
              'The reverse power rule fails at $n = -1$ because it divides by $0$—the special case $\\int u^{-1}\\,du$ is $\\ln|u| + C$.',
          },
          {
            id: 'c',
            latex: '\\ln|u| + C',
            correct: true,
          },
          {
            id: 'd',
            latex: 'e^u + C',
            correct: false,
            misconception:
              'Recall $(\\ln|u|)\' = \\frac{1}{u}$, whereas $(e^u)\' = e^u$.',
          },
        ],
        lockedLabel: 'u-Integral',
        lockedResultLatex: '\\int \\frac{1}{u}\\,du = \\textcolor{#34D399}{\\ln|u| + C}',
        hint: 'The antiderivative of $\\frac{1}{u}$ is the natural logarithm.',
      },
      {
        stepType: 'back_substitute',
        badge: 'Back-Substitute',
        prompt: 'Substitute $u = x^2 + x + 4$ back (note $x^2 + x + 4 = (x+\\tfrac{1}{2})^2 + \\tfrac{15}{4} > 0$ everywhere!).',
        highlightLatex:
          '\\ln\\big|\\textcolor{#22D3EE}{x^2 + x + 4}\\big| + C',
        options: [
          {
            id: 'a',
            latex: '\\ln(2x + 1) + C',
            correct: false,
            misconception:
              'Remember $u$ was the denominator $x^2 + x + 4$, while $2x + 1$ became $du$.',
          },
          {
            id: 'b',
            latex: '\\ln(x^2 + x + 4) + C',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{\\ln(x^2 + x + 4)}{2x + 1} + C',
            correct: false,
            misconception:
              'The numerator $(2x + 1)\\,dx$ already matched $du$ exactly, so no extra division is needed.',
          },
          {
            id: 'd',
            latex: '(2x + 1)\\ln(x^2 + x + 4) + C',
            correct: false,
            misconception:
              'Do not keep $2x + 1$ out front—it was consumed into $du$.',
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\ln(x^2 + x + 4) + C}',
        hint: 'Since $x^2 + x + 4 > 0$ for all real $x$, $\\ln|x^2 + x + 4| = \\ln(x^2 + x + 4)$.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: TRIGONOMETRIC INTEGRALS
  // =========================================================================
  {
    id: 'i7-trig-linear',
    tier: 'trig',
    tierLabel: 'Trig',
    title: 'Harmonic Signal Integration',
    mechatronicsContext:
      'Integrating an AC current or multi-harmonic vibration signal $4\\cos(2\\omega t) - 3\\sin(\\omega t)$ shifts each sinusoid by $90^\\circ$ and scales its amplitude inversely by frequency $k$.',
    expressionLatex: '\\int (4\\cos(2x) - 3\\sin(x))\\,dx',
    finalAnswerLatex: '\\int (4\\cos(2x) - 3\\sin(x))\\,dx = 2\\sin(2x) + 3\\cos(x) + C',
    domain: [0, 4.5],
    verifyFn: (x) => 4 * Math.cos(2 * x) - 3 * Math.sin(x),
    verifyAntiderivFn: (x) => 2 * Math.sin(2 * x) + 3 * Math.cos(x),
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Trig Identities',
        prompt: 'Which pair of trig antiderivative rules applies to $\\cos(kx)$ and $\\sin(x)$?',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{4\\cos(2x)}\\,dx - \\int \\textcolor{#F59E0B}{3\\sin(x)}\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\int \\cos(kx)\\,dx = -\\frac{1}{k}\\sin(kx),\\quad \\int \\sin(x)\\,dx = \\cos(x)',
            correct: false,
            misconception:
              'Both signs are flipped! Remember $(\\sin x)\' = +\\cos x$ and $(-\\cos x)\' = +\\sin x$.',
          },
          {
            id: 'b',
            latex: '\\int \\cos(kx)\\,dx = k\\sin(kx),\\quad \\int \\sin(x)\\,dx = -\\cos(x)',
            correct: false,
            misconception:
              'Differentiating multiplies by $k$; integrating divides by $k$ ($\\frac{1}{k}\\sin(kx)$).',
          },
          {
            id: 'c',
            latex: '\\int \\cos(kx)\\,dx = \\frac{1}{k}\\sin(kx),\\quad \\int \\sin(x)\\,dx = -\\cos(x)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\int \\cos(kx)\\,dx = \\sin(kx),\\quad \\int \\sin(x)\\,dx = -\\cos(x)',
            correct: false,
            misconception:
              'Watch the inner frequency $k$: differentiating $\\sin(2x)$ produces an extra factor of $2$, so we must divide by $k$.',
          },
        ],
        lockedLabel: 'Trig Rules',
        lockedResultLatex:
          '\\int \\cos(kx)\\,dx = \\frac{\\sin(kx)}{k},\\; \\int \\sin(x)\\,dx = -\\cos(x)',
        hint: 'Check each rule by differentiating its right-hand side back to the integrand.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Cosine Term',
        prompt: 'Integrate the scaled cosine term: $\\int 4\\cos(2x)\\,dx$.',
        highlightLatex: '\\int \\textcolor{#22D3EE}{4\\cos(\\textcolor{#F59E0B}{2}x)}\\,dx',
        options: [
          {
            id: 'a',
            latex: '8\\sin(2x)',
            correct: false,
            misconception:
              'Divide by the inner frequency $2$, do not multiply by $2$: $4 / 2 = 2$.',
          },
          {
            id: 'b',
            latex: '2\\sin(2x)',
            correct: true,
          },
          {
            id: 'c',
            latex: '-2\\sin(2x)',
            correct: false,
            misconception:
              'The derivative of $+\\sin(2x)$ is $+2\\cos(2x)$, so integrating $+\\cos(2x)$ stays positive.',
          },
          {
            id: 'd',
            latex: '4\\sin(2x)',
            correct: false,
            misconception:
              'Account for the chain-rule factor $2$ inside $\\cos(2x)$ by dividing $4$ by $2$.',
          },
        ],
        lockedLabel: 'First Term',
        lockedResultLatex: '\\int 4\\cos(2x)\\,dx = \\textcolor{#34D399}{2\\sin(2x)}',
        hint: 'Apply $4 \\cdot \\frac{1}{2}\\sin(2x)$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Sine Term Sign',
        prompt: 'Now integrate the second term carefully: $\\int (-3\\sin(x))\\,dx$.',
        highlightLatex: '\\int \\left(\\textcolor{#F59E0B}{-3\\sin(x)}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '-3\\cos(x)',
            correct: false,
            misconception:
              'Since $\\int \\sin(x)\\,dx = -\\cos(x)$, multiplying by $-3$ creates a double negative: $-3(-\\cos x) = +3\\cos x$.',
          },
          {
            id: 'b',
            latex: '3\\sin(x)',
            correct: false,
            misconception:
              'Integrating $\\sin(x)$ switches to cosine, not sine.',
          },
          {
            id: 'c',
            latex: '-\\frac{3}{2}\\cos(2x)',
            correct: false,
            misconception:
              'The second term has argument $x$, not $2x$.',
          },
          {
            id: 'd',
            latex: '+3\\cos(x)',
            correct: true,
          },
        ],
        lockedLabel: 'Second Term',
        lockedResultLatex: '\\int (-3\\sin(x))\\,dx = -3(-\\cos(x)) = \\textcolor{#34D399}{+3\\cos(x)}',
        hint: 'Two negatives cancel: $-3 \\cdot (-\\cos(x)) = +3\\cos(x)$.',
      },
      {
        stepType: 'assemble',
        badge: 'Combine Result',
        prompt: 'Combine both harmonic antiderivative terms with $+ C$.',
        highlightLatex:
          '\\textcolor{#34D399}{2\\sin(2x)} + \\textcolor{#34D399}{3\\cos(x)} + C',
        options: [
          {
            id: 'a',
            latex: '2\\sin(2x) - 3\\cos(x) + C',
            correct: false,
            misconception:
              'Check the derivative of $-3\\cos(x)$: it gives $+3\\sin(x)$, whereas our integrand has $-3\\sin(x)$.',
          },
          {
            id: 'b',
            latex: '2\\sin(2x) + 3\\cos(x) + C',
            correct: true,
          },
          {
            id: 'c',
            latex: '8\\sin(2x) + 3\\cos(x) + C',
            correct: false,
            misconception:
              'Remember the first term divided by $2$: $4/2 = 2$.',
          },
          {
            id: 'd',
            latex: '2\\cos(2x) + 3\\sin(x) + C',
            correct: false,
            misconception:
              'Make sure $\\cos(2x)$ integrated to $\\sin(2x)$ and $-\\sin(x)$ integrated to $+\\cos(x)$.',
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{2\\sin(2x) + 3\\cos(x) + C}',
        hint: 'Add the two locked terms from the ledger and include $+ C$.',
      },
    ],
  },

  {
    id: 'i8-trig-power',
    tier: 'trig',
    tierLabel: 'Trig',
    title: 'Trig Power Substitution',
    mechatronicsContext:
      'Nonlinear aerodynamic lift and crank-slider torque integrals frequently involve products of $\\sin^n(\\theta)\\cos(\\theta)$—recognizing $\\cos(\\theta)\\,d\\theta = d(\\sin\\theta)$ collapses them to a one-line power integral.',
    expressionLatex: '\\int \\sin^3(x)\\cos(x)\\,dx',
    finalAnswerLatex: '\\int \\sin^3(x)\\cos(x)\\,dx = \\frac{1}{4}\\sin^4(x) + C',
    domain: [0, 4.5],
    verifyFn: (x) => Math.pow(Math.sin(x), 3) * Math.cos(x),
    verifyAntiderivFn: (x) => 0.25 * Math.pow(Math.sin(x), 4),
    steps: [
      {
        stepType: 'choose_u',
        badge: 'Choose Trig u',
        prompt: 'One trig factor is raised to a power while the other is its exact derivative. Choose $u$.',
        highlightLatex:
          '\\int \\big(\\textcolor{#22D3EE}{\\sin(x)}\\big)^3\\,\\textcolor{#F59E0B}{\\cos(x)}\\,dx',
        options: [
          {
            id: 'a',
            latex: 'u = \\cos(x)',
            correct: false,
            misconception:
              'If $u = \\cos(x)$, $du = -\\sin(x)\\,dx$ still leaves $\\sin^2(x)$ behind—picking the base of the $3$rd power is much cleaner!',
          },
          {
            id: 'b',
            latex: 'u = \\sin(x)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u = \\sin^3(x)',
            correct: false,
            misconception:
              'Choose only the base $\\sin(x)$ without the cube so $du$ matches $\\cos(x)\\,dx$ directly.',
          },
          {
            id: 'd',
            latex: 'u = x',
            correct: false,
            misconception:
              'Setting $u = x$ changes nothing; let $u$ absorb the trig base $\\sin(x)$.',
          },
        ],
        lockedLabel: 'Choose u',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = \\sin(x)}',
        hint: 'Pick the trig function sitting inside the third power.',
      },
      {
        stepType: 'compute_du',
        badge: 'Compute du',
        prompt: 'Differentiate $u = \\sin(x)$ to find $du$.',
        highlightLatex: 'u = \\textcolor{#22D3EE}{\\sin(x)} \\implies du = \\text{?}',
        options: [
          {
            id: 'a',
            latex: 'du = -\\cos(x)\\,dx',
            correct: false,
            misconception:
              'Watch the sign: $\\frac{d}{dx}(\\sin x) = +\\cos x$ (it is $\\cos x$ whose derivative is $-\\sin x$).',
          },
          {
            id: 'b',
            latex: 'du = \\sin(x)\\,dx',
            correct: false,
            misconception:
              'Differentiating $\\sin(x)$ yields $\\cos(x)$, not $\\sin(x)$.',
          },
          {
            id: 'c',
            latex: 'du = \\cos(x)\\,dx',
            correct: true,
          },
          {
            id: 'd',
            latex: 'du = \\sec^2(x)\\,dx',
            correct: false,
            misconception:
              '$\\sec^2(x)$ is the derivative of $\\tan(x)$, whereas $(\\sin x)\' = \\cos x$.',
          },
        ],
        lockedLabel: 'Differential',
        lockedResultLatex: '\\textcolor{#F59E0B}{du = \\cos(x)\\,dx}',
        hint: 'Recall the positive derivative $(\\sin x)\' = \\cos x$.',
      },
      {
        stepType: 'rewrite_integrate',
        badge: 'Integrate u^3',
        prompt: 'Rewrite $\\int \\sin^3(x)\\cos(x)\\,dx$ in $u$ and integrate.',
        highlightLatex: '\\int \\textcolor{#22D3EE}{u}^3\\,\\textcolor{#F59E0B}{du}',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{4}u^4 + C',
            correct: true,
          },
          {
            id: 'b',
            latex: '3u^2 + C',
            correct: false,
            misconception:
              '$3u^2$ is the derivative of $u^3$; integrate upward to degree $4$.',
          },
          {
            id: 'c',
            latex: '\\frac{1}{3}u^4 + C',
            correct: false,
            misconception:
              'Divide by the new exponent $3 + 1 = 4$, not $3$.',
          },
          {
            id: 'd',
            latex: 'u^4 + C',
            correct: false,
            misconception:
              'Remember to divide by $4$ when raising $u^3 \\to u^4$.',
          },
        ],
        lockedLabel: 'u-Integral',
        lockedResultLatex: '\\int u^3\\,du = \\textcolor{#34D399}{\\frac{1}{4}u^4 + C}',
        hint: 'Apply the reverse power rule: $\\frac{u^{3+1}}{3+1} + C$.',
      },
      {
        stepType: 'back_substitute',
        badge: 'Back-Substitute',
        prompt: 'Substitute $u = \\sin(x)$ back for the final antiderivative.',
        highlightLatex:
          '\\frac{1}{4}\\big(\\textcolor{#22D3EE}{u}\\big)^4 + C, \\quad \\textcolor{#22D3EE}{u = \\sin(x)}',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{4}\\sin^4(x)\\cos(x) + C',
            correct: false,
            misconception:
              'The $\\cos(x)$ factor was absorbed into $du = \\cos(x)\\,dx$—do not leave it multiplied outside!',
          },
          {
            id: 'b',
            latex: '\\frac{1}{4}\\cos^4(x) + C',
            correct: false,
            misconception:
              'Remember $u = \\sin(x)$, not $\\cos(x)$.',
          },
          {
            id: 'c',
            latex: '-\\frac{1}{4}\\sin^4(x) + C',
            correct: false,
            misconception:
              'Both $du = +\\cos(x)\\,dx$ and $\\frac{1}{4}u^4$ are positive.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{4}\\sin^4(x) + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{1}{4}\\sin^4(x) + C}',
        hint: 'Replace $u^4$ with $\\sin^4(x)$ in $\\frac{1}{4}u^4 + C$.',
      },
    ],
  },

  {
    id: 'i9-trig-half-angle',
    tier: 'trig',
    tierLabel: 'Trig',
    title: 'Half-Angle Power Reduction',
    mechatronicsContext:
      'Calculating RMS AC power $P_{\\text{avg}} \\propto \\int \\sin^2(\\omega t)\\,dt$ requires the half-angle identity—it splits oscillatory energy into a steady DC ramp $\\frac{x}{2}$ plus a double-frequency ripple.',
    expressionLatex: '\\int \\sin^2(x)\\,dx',
    finalAnswerLatex: '\\int \\sin^2(x)\\,dx = \\frac{x}{2} - \\frac{\\sin(2x)}{4} + C',
    domain: [0, 4.5],
    verifyFn: (x) => Math.sin(x) ** 2,
    verifyAntiderivFn: (x) => x / 2 - Math.sin(2 * x) / 4,
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Half-Angle Identity',
        prompt: 'There is no $\\cos(x)$ factor for $u$-sub! Rewrite $\\sin^2(x)$ using the half-angle power-reduction identity.',
        highlightLatex: '\\int \\textcolor{#22D3EE}{\\sin^2(x)}\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\sin^2(x) = \\frac{1 + \\cos(2x)}{2}',
            correct: false,
            misconception:
              '$\\frac{1 + \\cos(2x)}{2}$ is the identity for $\\cos^2(x)$! Notice at $x = 0$, $\\sin^2(0) = 0$ requires the minus sign.',
          },
          {
            id: 'b',
            latex: '\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\sin^2(x) = \\frac{1 - \\sin(2x)}{2}',
            correct: false,
            misconception:
              'Power-reduction formulas use $\\cos(2x)$ (derived from $\\cos(2x) = 1 - 2\\sin^2 x$), not $\\sin(2x)$.',
          },
          {
            id: 'd',
            latex: '\\int \\sin^2(x)\\,dx = \\frac{1}{3}\\sin^3(x) + C',
            correct: false,
            misconception:
              'You cannot use the reverse power rule on $\\sin^2(x)$ without an accompanying $\\cos(x)\\,dx$ factor!',
          },
        ],
        lockedLabel: 'Identity',
        lockedResultLatex: '\\sin^2(x) = \\textcolor{#22D3EE}{\\frac{1 - \\cos(2x)}{2}}',
        hint: 'From $\\cos(2x) = 1 - 2\\sin^2(x)$, solve for $\\sin^2(x)$ and check at $x = 0$.',
      },
      {
        stepType: 'decompose',
        badge: 'Split Integrand',
        prompt: 'Split $\\int \\frac{1 - \\cos(2x)}{2}\\,dx$ into two elementary integrals.',
        highlightLatex:
          '\\int \\left(\\textcolor{#22D3EE}{\\frac{1}{2}} - \\textcolor{#F59E0B}{\\frac{1}{2}\\cos(2x)}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{2}\\int 1\\,dx - \\frac{1}{2}\\int \\cos(2x)\\,dx',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\int 1\\,dx - \\frac{1}{2}\\int \\cos(2x)\\,dx',
            correct: false,
            misconception:
              'The denominator $2$ divides both terms in the numerator: $\\frac{1}{2}$ and $-\\frac{1}{2}\\cos(2x)$.',
          },
          {
            id: 'c',
            latex: '\\frac{1}{2}\\int 1\\,dx + \\frac{1}{2}\\int \\cos(2x)\\,dx',
            correct: false,
            misconception:
              'Keep the minus sign in front of $\\cos(2x)$ from $\\frac{1 - \\cos(2x)}{2}$.',
          },
          {
            id: 'd',
            latex: '\\frac{1}{2}\\int 1\\,dx - \\int \\cos(x)\\,dx',
            correct: false,
            misconception:
              'You cannot pull the $2$ out of $\\cos(2x)$ to cancel the $\\frac{1}{2}$—the angle stays $2x$.',
          },
        ],
        lockedLabel: 'Split Form',
        lockedResultLatex: '\\frac{1}{2}\\int 1\\,dx - \\frac{1}{2}\\int \\cos(2x)\\,dx',
        hint: 'Distribute the factor $\\frac{1}{2}$ across both $1$ and $-\\cos(2x)$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Integrate Ripple',
        prompt: 'Integrate the double-angle cosine term: $-\\frac{1}{2}\\int \\cos(2x)\\,dx$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{-\\frac{1}{2}}\\int \\cos(\\textcolor{#22D3EE}{2}x)\\,dx',
        options: [
          {
            id: 'a',
            latex: '-\\frac{\\sin(2x)}{2}',
            correct: false,
            misconception:
              'Integrating $\\cos(2x)$ divides by an extra factor of $2$: $-\\frac{1}{2}\\cdot\\frac{\\sin(2x)}{2} = -\\frac{\\sin(2x)}{4}$.',
          },
          {
            id: 'b',
            latex: '+\\frac{\\sin(2x)}{4}',
            correct: false,
            misconception:
              'Since $\\int \\cos(2x)\\,dx = +\\frac{\\sin(2x)}{2}$, the outer minus sign stays negative.',
          },
          {
            id: 'c',
            latex: '-\\frac{\\sin(2x)}{4}',
            correct: true,
          },
          {
            id: 'd',
            latex: '-\\sin(2x)',
            correct: false,
            misconception:
              'Do not multiply by $2$—integrating $\\cos(2x)$ introduces $\\frac{1}{2}$, making $-\\frac{1}{4}\\sin(2x)$.',
          },
        ],
        lockedLabel: 'Cosine Part',
        lockedResultLatex:
          '-\\frac{1}{2}\\int \\cos(2x)\\,dx = \\textcolor{#34D399}{-\\frac{\\sin(2x)}{4}}',
        hint: 'Use $\\int \\cos(2x)\\,dx = \\frac{\\sin(2x)}{2}$, then multiply by $-\\frac{1}{2}$.',
      },
      {
        stepType: 'assemble',
        badge: 'Final Antiderivative',
        prompt: 'Combine $\\frac{1}{2}\\int 1\\,dx = \\frac{x}{2}$ with the ripple term and $+ C$.',
        highlightLatex:
          '\\textcolor{#34D399}{\\frac{x}{2}} \\textcolor{#34D399}{- \\frac{\\sin(2x)}{4}} + C',
        options: [
          {
            id: 'a',
            latex: '\\frac{x}{2} + \\frac{\\sin(2x)}{4} + C',
            correct: false,
            misconception:
              'That is the antiderivative of $\\cos^2(x)$! For $\\sin^2(x)$, the second term is subtracted.',
          },
          {
            id: 'b',
            latex: 'x - \\frac{\\sin(2x)}{4} + C',
            correct: false,
            misconception:
              'Remember the leading $\\frac{1}{2}$ on the constant term gives $\\frac{x}{2}$, not $x$.',
          },
          {
            id: 'c',
            latex: '\\frac{x}{2} - \\frac{\\sin(2x)}{2} + C',
            correct: false,
            misconception:
              'Check the denominator: $\\frac{1}{2} \\cdot \\frac{1}{2} = \\frac{1}{4}$.',
          },
          {
            id: 'd',
            latex: '\\frac{x}{2} - \\frac{\\sin(2x)}{4} + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{x}{2} - \\frac{\\sin(2x)}{4} + C}',
        hint: 'Combine $\\frac{x}{2}$ and $-\\frac{\\sin(2x)}{4}$, then append $+ C$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: INTEGRATION BY PARTS
  // =========================================================================
  {
    id: 'i10-ibp-xex',
    tier: 'ibp',
    tierLabel: 'By Parts',
    title: 'Classic By Parts: x·eˣ',
    mechatronicsContext:
      'Laplace transforms of ramp inputs ($t\\,e^{-st}$) and critically damped impulse responses all hinge on Integration by Parts with LIATE—differentiating the polynomial factor $x$ down to $1$.',
    expressionLatex: '\\int x\\,e^x\\,dx',
    finalAnswerLatex: '\\int x\\,e^x\\,dx = (x - 1)e^x + C',
    domain: [-1.5, 2],
    verifyFn: (x) => x * Math.exp(x),
    verifyAntiderivFn: (x) => (x - 1) * Math.exp(x),
    steps: [
      {
        stepType: 'choose_parts',
        badge: 'LIATE Split',
        prompt: 'Use LIATE (Log, Inverse trig, Algebraic, Trig, Exponential) to assign $u$ and $dv$.',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{x}\\,\\textcolor{#F59E0B}{e^x\\,dx}',
        options: [
          {
            id: 'a',
            latex: 'u = e^x,\\quad dv = x\\,dx',
            correct: false,
            misconception:
              'In LIATE, Algebraic ($x$) comes before Exponential ($e^x$). Setting $dv = x\\,dx$ raises the power to $\\frac{1}{2}x^2$, making the integral harder!',
          },
          {
            id: 'b',
            latex: 'u = x,\\quad dv = e^x\\,dx',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u = x\\,e^x,\\quad dv = dx',
            correct: false,
            misconception:
              'Assigning the whole product to $u$ creates an extra product-rule term instead of simplifying the integral.',
          },
          {
            id: 'd',
            latex: 'u = 1,\\quad dv = x\\,e^x\\,dx',
            correct: false,
            misconception:
              'Setting $dv$ to the full integrand means you would already need to know $\\int x\\,e^x\\,dx$ to find $v$!',
          },
        ],
        lockedLabel: 'LIATE Split',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x},\\quad \\textcolor{#F59E0B}{dv = e^x\\,dx}',
        hint: 'Pick $u$ so differentiating makes it simpler ($x \\to 1$), and $dv$ so integrating stays effortless ($e^x$).',
      },
      {
        stepType: 'compute_parts',
        badge: 'Find du & v',
        prompt: 'Differentiate $u = x$ to get $du$, and integrate $dv = e^x\\,dx$ to get $v$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{u = x} \\to du, \\qquad \\textcolor{#F59E0B}{dv = e^x\\,dx} \\to v',
        options: [
          {
            id: 'a',
            latex: 'du = dx,\\quad v = x\\,e^x',
            correct: false,
            misconception:
              'The antiderivative of $e^x$ is simply $e^x$, not $x\\,e^x$.',
          },
          {
            id: 'b',
            latex: 'du = \\frac{1}{2}x^2\\,dx,\\quad v = e^x',
            correct: false,
            misconception:
              'Differentiate $u = x$ (giving $1\\,dx$), do not integrate $u$!',
          },
          {
            id: 'c',
            latex: 'du = dx,\\quad v = e^x',
            correct: true,
          },
          {
            id: 'd',
            latex: 'du = 0,\\quad v = e^x',
            correct: false,
            misconception:
              'The derivative of $x$ is $1$, so $du = 1\\,dx = dx$, not $0$.',
          },
        ],
        lockedLabel: 'Parts Table',
        lockedResultLatex: 'du = \\textcolor{#22D3EE}{dx},\\quad v = \\textcolor{#34D399}{e^x}',
        hint: 'Compute $\\frac{d}{dx}(x) = 1$ and $\\int e^x\\,dx = e^x$.',
      },
      {
        stepType: 'apply_ibp',
        badge: 'Apply uv - ∫v du',
        prompt: 'Substitute $u, v, du$ into the Integration by Parts formula $\\int u\\,dv = uv - \\int v\\,du$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v} - \\int \\textcolor{#34D399}{v}\\,\\textcolor{#22D3EE}{du}',
        options: [
          {
            id: 'a',
            latex: 'x\\,e^x + \\int e^x\\,dx',
            correct: false,
            misconception:
              'Integration by Parts subtracts the new integral: $uv - \\int v\\,du$, not plus.',
          },
          {
            id: 'b',
            latex: 'x\\,e^x - \\int x\\,e^x\\,dx',
            correct: false,
            misconception:
              'In $\\int v\\,du$, we use $du = dx$ (not $u = x$), so the $x$ has disappeared from the new integral!',
          },
          {
            id: 'c',
            latex: 'e^x - \\int x\\,e^x\\,dx',
            correct: false,
            misconception:
              'The boundary term is $u\\cdot v = x\\cdot e^x$, and the remaining integral is $\\int e^x\\,dx$.',
          },
          {
            id: 'd',
            latex: 'x\\,e^x - \\int e^x\\,dx',
            correct: true,
          },
        ],
        lockedLabel: 'IBP Setup',
        lockedResultLatex: 'x\\,e^x - \\int e^x\\,dx',
        hint: 'Multiply $u\\cdot v = x\\,e^x$, then subtract $\\int v\\,du = \\int e^x\\,dx$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Finish Integral',
        prompt: 'Evaluate the remaining elementary integral $x\\,e^x - \\int e^x\\,dx$.',
        highlightLatex: 'x\\,e^x - \\textcolor{#F59E0B}{\\int e^x\\,dx}',
        options: [
          {
            id: 'a',
            latex: 'x\\,e^x - e^x + C',
            correct: true,
          },
          {
            id: 'b',
            latex: 'x\\,e^x + e^x + C',
            correct: false,
            misconception:
              'Since $\\int e^x\\,dx = +e^x$, the minus sign stays: $x\\,e^x - e^x + C$.',
          },
          {
            id: 'c',
            latex: 'x\\,e^x - x\\,e^x + C',
            correct: false,
            misconception:
              '$\\int e^x\\,dx = e^x$, not $x\\,e^x$.',
          },
          {
            id: 'd',
            latex: 'x\\,e^x - 1 + C',
            correct: false,
            misconception:
              'We are integrating $e^x$ (giving $e^x$), not $1$.',
          },
        ],
        lockedLabel: 'Expanded Form',
        lockedResultLatex: '\\textcolor{#34D399}{x\\,e^x - e^x + C}',
        hint: 'Replace $\\int e^x\\,dx$ with $e^x$ and add $+C$.',
      },
      {
        stepType: 'simplify',
        badge: 'Factor Result',
        prompt: 'Factor out the common exponential $e^x$ to write the cleanest final form.',
        highlightLatex:
          'x\\,\\textcolor{#34D399}{e^x} - 1\\cdot\\textcolor{#34D399}{e^x} + C',
        options: [
          {
            id: 'a',
            latex: '(x + 1)e^x + C',
            correct: false,
            misconception:
              'Check the sign inside the parentheses: factoring $e^x$ from $x e^x - e^x$ gives $(x - 1)e^x$.',
          },
          {
            id: 'b',
            latex: '(x - 1)e^x + C',
            correct: true,
          },
          {
            id: 'c',
            latex: 'x(e^x - 1) + C',
            correct: false,
            misconception:
              'Expanding $x(e^x - 1)$ gives $x e^x - x$, not $x e^x - e^x$. Factor out $e^x$ instead.',
          },
          {
            id: 'd',
            latex: '(1 - x)e^x + C',
            correct: false,
            misconception:
              'That negates the entire result: $(1-x)e^x = e^x - x e^x$, which differentiates to $-x e^x$.',
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{(x - 1)e^x + C}',
        hint: 'Pull $e^x$ out of both terms: $x\\,e^x - 1\\cdot e^x = (x - 1)e^x$.',
      },
    ],
  },

  {
    id: 'i11-ibp-xcos',
    tier: 'ibp',
    tierLabel: 'By Parts',
    title: 'Oscillatory Ramp: x·cos(x)',
    mechatronicsContext:
      'Computing Fourier coefficients $a_n = \\frac{1}{\\pi}\\int t\\cos(nt)\\,dt$ for sawtooth PWM waveforms requires Integration by Parts with a careful double-negative sign check.',
    expressionLatex: '\\int x\\cos(x)\\,dx',
    finalAnswerLatex: '\\int x\\cos(x)\\,dx = x\\sin(x) + \\cos(x) + C',
    domain: [-3, 3],
    verifyFn: (x) => x * Math.cos(x),
    verifyAntiderivFn: (x) => x * Math.sin(x) + Math.cos(x),
    steps: [
      {
        stepType: 'choose_parts',
        badge: 'LIATE Split',
        prompt: 'Apply LIATE to choose $u$ and $dv$ for $\\int x\\cos(x)\\,dx$.',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{x}\\,\\textcolor{#F59E0B}{\\cos(x)\\,dx}',
        options: [
          {
            id: 'a',
            latex: 'u = \\cos(x),\\quad dv = x\\,dx',
            correct: false,
            misconception:
              'Algebraic ($x$) beats Trigonometric ($\\cos x$) in LIATE—integrating $x\\,dx$ raises the degree to $x^2$ instead of eliminating $x$.',
          },
          {
            id: 'b',
            latex: 'u = x,\\quad dv = \\cos(x)\\,dx',
            correct: true,
          },
          {
            id: 'c',
            latex: 'u = x\\cos(x),\\quad dv = dx',
            correct: false,
            misconception:
              'Keep the polynomial $x$ and trig factor $\\cos(x)$ separated across $u$ and $dv$.',
          },
          {
            id: 'd',
            latex: 'u = \\sin(x),\\quad dv = x\\,dx',
            correct: false,
            misconception:
              'The integrand contains $\\cos(x)$, not $\\sin(x)$, and $u$ should be the algebraic factor $x$.',
          },
        ],
        lockedLabel: 'LIATE Split',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x},\\quad \\textcolor{#F59E0B}{dv = \\cos(x)\\,dx}',
        hint: 'In LIATE, Algebraic ($x$) precedes Trigonometric ($\\cos x$).',
      },
      {
        stepType: 'compute_parts',
        badge: 'Compute du & v',
        prompt: 'Compute $du$ from $u = x$, and $v = \\int \\cos(x)\\,dx$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{u = x} \\to du, \\qquad \\textcolor{#F59E0B}{dv = \\cos(x)\\,dx} \\to v',
        options: [
          {
            id: 'a',
            latex: 'du = dx,\\quad v = -\\sin(x)',
            correct: false,
            misconception:
              'Be careful not to confuse derivative and antiderivative! $\\frac{d}{dx}(\\cos x) = -\\sin x$, but $\\int \\cos x\\,dx = +\\sin x$.',
          },
          {
            id: 'b',
            latex: 'du = x\\,dx,\\quad v = \\sin(x)',
            correct: false,
            misconception:
              'Differentiating $u = x$ gives $du = 1\\,dx = dx$.',
          },
          {
            id: 'c',
            latex: 'du = dx,\\quad v = \\sin(x)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'du = dx,\\quad v = \\cos(x)',
            correct: false,
            misconception:
              'Integrate $\\cos(x)$ to get $\\sin(x)$.',
          },
        ],
        lockedLabel: 'Parts Table',
        lockedResultLatex: 'du = \\textcolor{#22D3EE}{dx},\\quad v = \\textcolor{#34D399}{\\sin(x)}',
        hint: 'Check $v$ by differentiating: $\\frac{d}{dx}(\\sin x) = +\\cos x$.',
      },
      {
        stepType: 'apply_ibp',
        badge: 'Apply uv - ∫v du',
        prompt: 'Substitute $u, v, du$ into $uv - \\int v\\,du$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{x}\\,\\textcolor{#34D399}{\\sin(x)} - \\int \\textcolor{#34D399}{\\sin(x)}\\,\\textcolor{#22D3EE}{dx}',
        options: [
          {
            id: 'a',
            latex: 'x\\sin(x) - \\int \\sin(x)\\,dx',
            correct: true,
          },
          {
            id: 'b',
            latex: 'x\\sin(x) + \\int \\sin(x)\\,dx',
            correct: false,
            misconception:
              'The formula always starts with a minus sign: $uv - \\int v\\,du$. The sign flip happens in the next step!',
          },
          {
            id: 'c',
            latex: 'x\\cos(x) - \\int \\sin(x)\\,dx',
            correct: false,
            misconception:
              'Remember the first term is $u\\cdot v = x\\sin(x)$, not $x\\cos(x)$.',
          },
          {
            id: 'd',
            latex: 'x\\sin(x) - \\int x\\sin(x)\\,dx',
            correct: false,
            misconception:
              'Since $du = dx$, there is no $x$ left inside $\\int v\\,du$.',
          },
        ],
        lockedLabel: 'IBP Setup',
        lockedResultLatex: 'x\\sin(x) - \\int \\sin(x)\\,dx',
        hint: 'Write $uv - \\int v\\,du$ using $u = x$, $v = \\sin(x)$, and $du = dx$.',
      },
      {
        stepType: 'assemble',
        badge: 'Double Negative',
        prompt: 'Evaluate $-\\int \\sin(x)\\,dx$ carefully and assemble the final antiderivative.',
        highlightLatex:
          'x\\sin(x) - \\left(\\textcolor{#F59E0B}{\\int \\sin(x)\\,dx}\\right)',
        options: [
          {
            id: 'a',
            latex: 'x\\sin(x) - \\cos(x) + C',
            correct: false,
            misconception:
              'Watch the double negative! Since $\\int \\sin(x)\\,dx = -\\cos(x)$, subtracting it gives $-(-\\cos x) = +\\cos x$.',
          },
          {
            id: 'b',
            latex: '-x\\sin(x) + \\cos(x) + C',
            correct: false,
            misconception:
              'The $uv$ term $+x\\sin(x)$ stays positive.',
          },
          {
            id: 'c',
            latex: 'x\\cos(x) + \\sin(x) + C',
            correct: false,
            misconception:
              'Differentiating $x\\cos x + \\sin x$ gives $-x\\sin x + 2\\cos x$, not $x\\cos x$.',
          },
          {
            id: 'd',
            latex: 'x\\sin(x) + \\cos(x) + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{x\\sin(x) + \\cos(x) + C}',
        hint: 'Substitute $\\int \\sin(x)\\,dx = -\\cos(x)$ into $x\\sin(x) - (-\\cos(x)) + C$.',
      },
    ],
  },

  {
    id: 'i12-ibp-lnx',
    tier: 'ibp',
    tierLabel: 'By Parts',
    title: 'Entropy Integral: ln(x)',
    mechatronicsContext:
      'Shannon entropy and Stirling’s factorial approximation ($\\ln(n!) \\approx \\int \\ln x\\,dx = x\\ln x - x$) emerge directly from the classic "hidden factor of $1$" Integration by Parts trick.',
    expressionLatex: '\\int \\ln(x)\\,dx',
    finalAnswerLatex: '\\int \\ln(x)\\,dx = x\\ln(x) - x + C',
    domain: [0.4, 4],
    verifyFn: (x) => Math.log(x),
    verifyAntiderivFn: (x) => x * Math.log(x) - x,
    steps: [
      {
        stepType: 'choose_parts',
        badge: 'Hidden 1·dx Trick',
        prompt: 'Write $\\ln(x)\\,dx$ as a product $\\ln(x)\\cdot 1\\,dx$ and assign $u$ and $dv$ using LIATE.',
        highlightLatex:
          '\\int \\textcolor{#22D3EE}{\\ln(x)}\\cdot \\textcolor{#F59E0B}{1\\,dx}',
        options: [
          {
            id: 'a',
            latex: 'u = 1,\\quad dv = \\ln(x)\\,dx',
            correct: false,
            misconception:
              'If $dv = \\ln(x)\\,dx$, finding $v$ is the exact original problem! Logarithms ALWAYS go in $u$ (L is first in LIATE).',
          },
          {
            id: 'b',
            latex: 'u = x,\\quad dv = \\frac{1}{x}\\,dx',
            correct: false,
            misconception:
              'The integrand is $\\ln(x)$, not $x\\cdot\\frac{1}{x} = 1$.',
          },
          {
            id: 'c',
            latex: 'u = \\ln(x),\\quad dv = 1\\,dx',
            correct: true,
          },
          {
            id: 'd',
            latex: 'u = \\frac{1}{x},\\quad dv = \\ln(x)\\,dx',
            correct: false,
            misconception:
              'Do not insert extra factors that change the integrand—only rewrite $\\ln(x) = \\ln(x)\\cdot 1$.',
          },
        ],
        lockedLabel: 'LIATE Split',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = \\ln(x)},\\quad \\textcolor{#F59E0B}{dv = 1\\,dx}',
        hint: 'L (Logarithmic) is at the very top of LIATE, so let $u = \\ln(x)$ and $dv = 1\\,dx$.',
      },
      {
        stepType: 'compute_parts',
        badge: 'Compute du & v',
        prompt: 'Differentiate $u = \\ln(x)$ to find $du$, and integrate $dv = 1\\,dx$ to find $v$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{u = \\ln(x)} \\to du, \\qquad \\textcolor{#F59E0B}{dv = 1\\,dx} \\to v',
        options: [
          {
            id: 'a',
            latex: 'du = \\frac{1}{x}\\,dx,\\quad v = x',
            correct: true,
          },
          {
            id: 'b',
            latex: 'du = \\frac{1}{x}\\,dx,\\quad v = 1',
            correct: false,
            misconception:
              'Integrating $1\\,dx$ gives $v = x$, not $1$.',
          },
          {
            id: 'c',
            latex: 'du = e^x\\,dx,\\quad v = x',
            correct: false,
            misconception:
              'The derivative of $\\ln(x)$ is $\\frac{1}{x}$, not $e^x$.',
          },
          {
            id: 'd',
            latex: 'du = \\ln(x)\\,dx,\\quad v = x',
            correct: false,
            misconception:
              'Differentiate $\\ln(x)$ to get $\\frac{1}{x}\\,dx$.',
          },
        ],
        lockedLabel: 'Parts Table',
        lockedResultLatex: 'du = \\textcolor{#22D3EE}{\\frac{1}{x}\\,dx},\\quad v = \\textcolor{#34D399}{x}',
        hint: 'Recall $(\\ln x)\' = \\frac{1}{x}$ and $\\int 1\\,dx = x$.',
      },
      {
        stepType: 'apply_ibp',
        badge: 'Apply & Cancel x',
        prompt: 'Substitute into $uv - \\int v\\,du$ and simplify the product $v\\,du = x\\cdot\\frac{1}{x}\\,dx$.',
        highlightLatex:
          '\\textcolor{#34D399}{x}\\,\\textcolor{#22D3EE}{\\ln(x)} - \\int \\textcolor{#34D399}{x}\\cdot\\textcolor{#22D3EE}{\\frac{1}{x}}\\,dx',
        options: [
          {
            id: 'a',
            latex: 'x\\ln(x) - \\int \\frac{1}{x}\\,dx',
            correct: false,
            misconception:
              'Do not forget to multiply by $v = x$: $x \\cdot \\frac{1}{x}$ cancels cleanly to $1$!',
          },
          {
            id: 'b',
            latex: 'x\\ln(x) + \\int 1\\,dx',
            correct: false,
            misconception:
              'Integration by Parts subtracts $\\int v\\,du$, keeping the minus sign.',
          },
          {
            id: 'c',
            latex: 'x\\ln(x) - \\int 1\\,dx',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\ln(x) - \\int 1\\,dx',
            correct: false,
            misconception:
              'The first term is $u\\cdot v = x\\ln(x)$, not just $\\ln(x)$.',
          },
        ],
        lockedLabel: 'Simplified IBP',
        lockedResultLatex: 'x\\ln(x) - \\int 1\\,dx',
        hint: 'Notice how $x \\cdot \\frac{1}{x} = 1$ cancels the logarithm completely!',
      },
      {
        stepType: 'assemble',
        badge: 'Final Antiderivative',
        prompt: 'Finish integrating $-\\int 1\\,dx$ to get the celebrated antiderivative of $\\ln(x)$.',
        highlightLatex: 'x\\ln(x) - \\textcolor{#F59E0B}{\\int 1\\,dx}',
        options: [
          {
            id: 'a',
            latex: 'x\\ln(x) - 1 + C',
            correct: false,
            misconception:
              'Integrating $1$ gives $x$, not $1$. Check by differentiating: $(x\\ln x - x)\' = \\ln x + 1 - 1 = \\ln x$!',
          },
          {
            id: 'b',
            latex: 'x\\ln(x) + x + C',
            correct: false,
            misconception:
              'Keep the minus sign from $-\\int 1\\,dx = -x$.',
          },
          {
            id: 'c',
            latex: '\\frac{1}{x} + C',
            correct: false,
            misconception:
              '$\\frac{1}{x}$ is the derivative of $\\ln(x)$, not its integral.',
          },
          {
            id: 'd',
            latex: 'x\\ln(x) - x + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{x\\ln(x) - x + C}',
        hint: 'Replace $\\int 1\\,dx$ with $x$ and include $+ C$.',
      },
    ],
  },

  // =========================================================================
  // TIER 5: PARTIAL FRACTIONS
  // =========================================================================
  {
    id: 'i13-pf-distinct',
    tier: 'partial',
    tierLabel: 'Partial Frac',
    title: 'Distinct Linear Poles',
    mechatronicsContext:
      'Inverting a second-order Laplace transfer function $H(s) = \\frac{5}{(s-1)(s+4)}$ splits coupled pole dynamics into independent first-order exponential modes using the Heaviside cover-up method.',
    expressionLatex: '\\int \\frac{5}{(x - 1)(x + 4)}\\,dx',
    finalAnswerLatex:
      '\\int \\frac{5}{(x - 1)(x + 4)}\\,dx = \\ln|x - 1| - \\ln|x + 4| + C',
    domain: [1.5, 5],
    verifyFn: (x) => 5 / ((x - 1) * (x + 4)),
    verifyAntiderivFn: (x) => Math.log(Math.abs(x - 1)) - Math.log(Math.abs(x + 4)),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Partial Frac Form',
        prompt: 'Decompose the proper rational function into a sum of simple fractions over its two distinct linear factors.',
        highlightLatex:
          '\\frac{5}{(\\textcolor{#22D3EE}{x - 1})(\\textcolor{#F59E0B}{x + 4})} = \\text{?}',
        options: [
          {
            id: 'a',
            latex: '\\frac{A}{x - 1} + \\frac{B}{x + 4}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\frac{Ax + B}{x - 1} + \\frac{C}{x + 4}',
            correct: false,
            misconception:
              'Linear denominators $(x - 1)$ only need a constant numerator $A$; $Ax + B$ is reserved for irreducible quadratics.',
          },
          {
            id: 'c',
            latex: '\\frac{A}{x - 1} \\cdot \\frac{B}{x + 4}',
            correct: false,
            misconception:
              'Partial fraction decomposition rewrites a product of denominators as a SUM of simpler fractions so we can integrate term-by-term.',
          },
          {
            id: 'd',
            latex: '\\frac{5}{x - 1} + \\frac{5}{x + 4}',
            correct: false,
            misconception:
              'You cannot simply copy $5$ into both numerators—solve for constants $A$ and $B$ first.',
          },
        ],
        lockedLabel: 'Template',
        lockedResultLatex:
          '\\frac{5}{(x-1)(x+4)} = \\frac{\\textcolor{#22D3EE}{A}}{x - 1} + \\frac{\\textcolor{#F59E0B}{B}}{x + 4}',
        hint: 'Each distinct linear factor $(x - r)$ gets its own constant numerator term.',
      },
      {
        stepType: 'solve_coeff',
        badge: 'Solve A (Cover-Up)',
        prompt: 'Multiply by $(x-1)(x+4)$ to get $5 = A(x+4) + B(x-1)$, then plug in $x = 1$ to isolate $A$.',
        highlightLatex:
          '5 = \\textcolor{#22D3EE}{A}(\\textcolor{#22D3EE}{1} + 4) + \\textcolor{#F59E0B}{B}(\\textcolor{#22D3EE}{1} - 1)',
        options: [
          {
            id: 'a',
            latex: 'A = 5',
            correct: false,
            misconception:
              'Divide $5$ by $(1 + 4) = 5$: $A = \\frac{5}{5} = 1$, not $5$.',
          },
          {
            id: 'b',
            latex: 'A = -1',
            correct: false,
            misconception:
              'At $x = 1$, both sides are positive: $5 = 5A \\implies A = +1$.',
          },
          {
            id: 'c',
            latex: 'A = 1',
            correct: true,
          },
          {
            id: 'd',
            latex: 'A = \\frac{1}{5}',
            correct: false,
            misconception:
              'The numerator is $5$ (not $1$), so $5A = 5 \\implies A = 1$.',
          },
        ],
        lockedLabel: 'Coeff A',
        lockedResultLatex: '5 = 5A \\implies \\textcolor{#22D3EE}{A = 1}',
        hint: 'Notice $B(1 - 1) = 0$ vanishes immediately, leaving $5 = 5A$.',
      },
      {
        stepType: 'solve_coeff',
        badge: 'Solve B (Cover-Up)',
        prompt: 'Now plug in $x = -4$ into $5 = A(x+4) + B(x-1)$ to isolate $B$.',
        highlightLatex:
          '5 = \\textcolor{#22D3EE}{A}(\\textcolor{#F59E0B}{-4} + 4) + \\textcolor{#F59E0B}{B}(\\textcolor{#F59E0B}{-4} - 1)',
        options: [
          {
            id: 'a',
            latex: 'B = 1',
            correct: false,
            misconception:
              'Watch the sign: $(-4 - 1) = -5$, so $5 = -5B \\implies B = -1$.',
          },
          {
            id: 'b',
            latex: 'B = -1',
            correct: true,
          },
          {
            id: 'c',
            latex: 'B = -\\frac{5}{3}',
            correct: false,
            misconception:
              'Careful with subtraction: $-4 - 1 = -5$ (not $-3$).',
          },
          {
            id: 'd',
            latex: 'B = -5',
            correct: false,
            misconception:
              'Divide $5$ by $-5$ to obtain $B = -1$.',
          },
        ],
        lockedLabel: 'Coeff B',
        lockedResultLatex: '5 = -5B \\implies \\textcolor{#F59E0B}{B = -1}',
        hint: 'At $x = -4$, $A(-4 + 4) = 0$ vanishes, leaving $5 = -5B$.',
      },
      {
        stepType: 'integrate_part',
        badge: 'Split Integral',
        prompt: 'Substitute $A = 1$ and $B = -1$ into the integral to see the two log terms.',
        highlightLatex:
          '\\int \\left(\\frac{\\textcolor{#22D3EE}{1}}{x - 1} + \\frac{\\textcolor{#F59E0B}{-1}}{x + 4}\\right)\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\int \\frac{1}{x - 1}\\,dx + \\int \\frac{1}{x + 4}\\,dx',
            correct: false,
            misconception:
              'Remember $B = -1$, so the second fraction is subtracted!',
          },
          {
            id: 'b',
            latex: '\\int \\frac{1}{x - 1}\\,dx - \\int \\frac{1}{x + 4}\\,dx',
            correct: true,
          },
          {
            id: 'c',
            latex: '5\\int \\frac{1}{x - 1}\\,dx - 5\\int \\frac{1}{x + 4}\\,dx',
            correct: false,
            misconception:
              'The factor $5$ was already accounted for when solving $A = 1$ and $B = -1$.',
          },
          {
            id: 'd',
            latex: '-\\int \\frac{1}{x - 1}\\,dx + \\int \\frac{1}{x + 4}\\,dx',
            correct: false,
            misconception:
              'The signs are swapped: $A = +1$ belongs over $(x - 1)$ and $B = -1$ belongs over $(x + 4)$.',
          },
        ],
        lockedLabel: 'Decomposed',
        lockedResultLatex: '\\int \\frac{1}{x - 1}\\,dx - \\int \\frac{1}{x + 4}\\,dx',
        hint: 'Place $A = 1$ over $(x - 1)$ and $B = -1$ over $(x + 4)$.',
      },
      {
        stepType: 'assemble',
        badge: 'Integrate Logs',
        prompt: 'Integrate both linear reciprocal terms to finish.',
        highlightLatex:
          '\\int \\frac{1}{\\textcolor{#22D3EE}{x - 1}}\\,dx - \\int \\frac{1}{\\textcolor{#F59E0B}{x + 4}}\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\ln|x - 1| + \\ln|x + 4| + C',
            correct: false,
            misconception:
              'Keep the minus sign in front of $\\ln|x + 4|$ from $B = -1$.',
          },
          {
            id: 'b',
            latex: '-\\frac{1}{(x-1)^2} + \\frac{1}{(x+4)^2} + C',
            correct: false,
            misconception:
              'You differentiated instead of integrating! Recall $\\int \\frac{1}{x - r}\\,dx = \\ln|x - r| + C$.',
          },
          {
            id: 'c',
            latex: '\\ln|(x - 1)(x + 4)| + C',
            correct: false,
            misconception:
              'A difference of logs combines into a quotient $\\ln\\left|\\frac{x-1}{x+4}\\right|$, not a product.',
          },
          {
            id: 'd',
            latex: '\\ln|x - 1| - \\ln|x + 4| + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\ln|x - 1| - \\ln|x + 4| + C}',
        hint: 'Each term $\\int \\frac{1}{x - r}\\,dx$ evaluates directly to $\\ln|x - r|$.',
      },
    ],
  },

  {
    id: 'i14-pf-linear',
    tier: 'partial',
    tierLabel: 'Partial Frac',
    title: 'Linear Numerator Decomposition',
    mechatronicsContext:
      'Proper rational transfer functions with a zero in the numerator like $\\frac{2s + 3}{s(s + 3)}$ decompose cleanly into an integrator pole ($1/s$) plus a first-order lag pole ($1/(s+3)$).',
    expressionLatex: '\\int \\frac{2x + 3}{x(x + 3)}\\,dx',
    finalAnswerLatex: '\\int \\frac{2x + 3}{x(x + 3)}\\,dx = \\ln|x| + \\ln|x + 3| + C',
    domain: [0.4, 4],
    verifyFn: (x) => (2 * x + 3) / (x * (x + 3)),
    verifyAntiderivFn: (x) => Math.log(Math.abs(x)) + Math.log(Math.abs(x + 3)),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Partial Frac Form',
        prompt: 'Set up the partial fraction template for $\\frac{2x + 3}{x(x + 3)}$.',
        highlightLatex:
          '\\frac{2x + 3}{\\textcolor{#22D3EE}{x}(\\textcolor{#F59E0B}{x + 3})} = \\text{?}',
        options: [
          {
            id: 'a',
            latex: '\\frac{2x}{x} + \\frac{3}{x + 3}',
            correct: false,
            misconception:
              'Denominators do not split term-by-term across numerator terms; write unknown constants $A$ and $B$ over each factor.',
          },
          {
            id: 'b',
            latex: '\\frac{A}{x} + \\frac{B}{x + 3}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{Ax}{x} + \\frac{B}{x + 3}',
            correct: false,
            misconception:
              'Since the factor $x$ is linear, its numerator is a plain constant $A$.',
          },
          {
            id: 'd',
            latex: '\\frac{A}{x} + \\frac{B}{x^2} + \\frac{C}{x + 3}',
            correct: false,
            misconception:
              'The factor $x$ appears only once (not $x^2$), so only two fractions are needed.',
          },
        ],
        lockedLabel: 'Template',
        lockedResultLatex:
          '\\frac{2x + 3}{x(x + 3)} = \\frac{\\textcolor{#22D3EE}{A}}{x} + \\frac{\\textcolor{#F59E0B}{B}}{x + 3}',
        hint: 'Assign one constant over $x$ and one constant over $(x + 3)$.',
      },
      {
        stepType: 'solve_coeff',
        badge: 'Solve A at x = 0',
        prompt: 'Clear denominators to get $2x + 3 = A(x + 3) + Bx$, then evaluate at $x = 0$ to find $A$.',
        highlightLatex:
          '2(\\textcolor{#22D3EE}{0}) + 3 = \\textcolor{#22D3EE}{A}(\\textcolor{#22D3EE}{0} + 3) + \\textcolor{#F59E0B}{B}(\\textcolor{#22D3EE}{0})',
        options: [
          {
            id: 'a',
            latex: 'A = 3',
            correct: false,
            misconception:
              'Solve $3 = 3A$ by dividing by $3$: $A = 1$, not $3$.',
          },
          {
            id: 'b',
            latex: 'A = 0',
            correct: false,
            misconception:
              'At $x = 0$, the left-hand side is $2(0) + 3 = 3$, not $0$.',
          },
          {
            id: 'c',
            latex: 'A = 1',
            correct: true,
          },
          {
            id: 'd',
            latex: 'A = 2',
            correct: false,
            misconception:
              'Plugging in $x = 0$ eliminates $2x$, leaving $3 = 3A \\implies A = 1$.',
          },
        ],
        lockedLabel: 'Coeff A',
        lockedResultLatex: '3 = 3A \\implies \\textcolor{#22D3EE}{A = 1}',
        hint: 'At $x = 0$, $Bx$ disappears, leaving $3 = 3A$.',
      },
      {
        stepType: 'solve_coeff',
        badge: 'Solve B at x = -3',
        prompt: 'Now plug $x = -3$ into $2x + 3 = A(x + 3) + Bx$ to isolate $B$.',
        highlightLatex:
          '2(\\textcolor{#F59E0B}{-3}) + 3 = \\textcolor{#22D3EE}{A}(\\textcolor{#F59E0B}{-3} + 3) + \\textcolor{#F59E0B}{B}(\\textcolor{#F59E0B}{-3})',
        options: [
          {
            id: 'a',
            latex: 'B = -1',
            correct: false,
            misconception:
              'Watch the signs: $2(-3) + 3 = -3$ and $B(-3) = -3B$, so dividing $-3$ by $-3$ yields $+1$!',
          },
          {
            id: 'b',
            latex: 'B = 1',
            correct: true,
          },
          {
            id: 'c',
            latex: 'B = 3',
            correct: false,
            misconception:
              'Check the left side: $2(-3) + 3 = -6 + 3 = -3$, so $-3 = -3B \\implies B = 1$.',
          },
          {
            id: 'd',
            latex: 'B = -3',
            correct: false,
            misconception:
              'Divide $-3$ by $-3$ to solve for $B$.',
          },
        ],
        lockedLabel: 'Coeff B',
        lockedResultLatex: '-3 = -3B \\implies \\textcolor{#F59E0B}{B = 1}',
        hint: 'Compute $2(-3) + 3 = -3$ on the left and $-3B$ on the right.',
      },
      {
        stepType: 'assemble',
        badge: 'Integrate Both Terms',
        prompt: 'Integrate $\\int \\left(\\frac{1}{x} + \\frac{1}{x + 3}\\right)\\,dx$ to obtain the final antiderivative.',
        highlightLatex:
          '\\int \\frac{\\textcolor{#22D3EE}{1}}{x}\\,dx + \\int \\frac{\\textcolor{#F59E0B}{1}}{x + 3}\\,dx',
        options: [
          {
            id: 'a',
            latex: '\\ln|x| - \\ln|x + 3| + C',
            correct: false,
            misconception:
              'Both $A = +1$ and $B = +1$ are positive, so the two logarithms are added.',
          },
          {
            id: 'b',
            latex: '\\ln|x| + \\frac{1}{3}\\ln|x + 3| + C',
            correct: false,
            misconception:
              'The coefficient of $x$ inside $(x + 3)$ is $1$ (not $3$), so there is no $\\frac{1}{3}$ factor.',
          },
          {
            id: 'c',
            latex: '\\ln|2x + 3| + C',
            correct: false,
            misconception:
              'Remember the denominators are $x$ and $(x + 3)$—integrating gives $\\ln|x| + \\ln|x+3| + C$.',
          },
          {
            id: 'd',
            latex: '\\ln|x| + \\ln|x + 3| + C',
            correct: true,
          },
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: '\\textcolor{#34D399}{\\ln|x| + \\ln|x + 3| + C}',
        hint: 'Integrate $\\frac{1}{x}$ to $\\ln|x|$ and $\\frac{1}{x + 3}$ to $\\ln|x + 3|$, then add $+ C$.',
      },
    ],
  },
];
