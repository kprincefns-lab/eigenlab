/**
 * EIGENLAB — Derivatives Paperless Step-by-Step Problem Bank
 * 18 multi-step calculus problems spanning 5 progressive mastery tiers.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Outer function / u / primary factor
 *  - Amber  (#F59E0B): Inner function / v / exponent / secondary factor
 *  - Emerald(#34D399): Derivative / solved result
 */

export const SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'power', label: 'Power & Linearity' },
  { id: 'trig-exp', label: 'Trig & Exp' },
  { id: 'product', label: 'Product Rule' },
  { id: 'quotient', label: 'Quotient Rule' },
  { id: 'chain', label: 'Chain & Combo' }
];

export const DERIVATIVE_PROBLEMS = [
  // =========================================================================
  // TIER 1: POWER & LINEARITY
  // =========================================================================
  {
    id: 'prob-01-poly-linearity',
    tier: 'power',
    tierLabel: 'Power & Linearity',
    title: 'Cubic Polynomial Velocity',
    mechatronicsContext:
      'Differentiating a cubic joint trajectory $s(t)$ gives the exact actuator velocity profile $v(t)$.',
    expressionLatex: 'f(x) = 4x^3 - 6x^2 + 5x - 8',
    finalAnswerLatex: "f'(x) = 12x^2 - 12x + 5",
    domain: [-1.5, 2.5],
    verifyFn: (x) => 4 * x ** 3 - 6 * x ** 2 + 5 * x - 8,
    verifyDerivFn: (x) => 12 * x ** 2 - 12 * x + 5,
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Identify Rule',
        prompt: 'Which differentiation strategy applies to a sum and difference of power terms?',
        highlightLatex:
          '\\textcolor{#22D3EE}{4x^3} - \\textcolor{#22D3EE}{6x^2} + \\textcolor{#22D3EE}{5x} - \\textcolor{#F59E0B}{8}',
        options: [
          {
            id: 'a',
            latex: "(u\\cdot v)' = u'v + uv'",
            correct: false,
            misconception:
              'The terms are added and subtracted rather than multiplied together—use Linearity + Power Rule instead of Product Rule.'
          },
          {
            id: 'b',
            latex: '\\text{Linearity + Power Rule: } \\frac{d}{dx}(c\\,x^n) = c\\,n\\,x^{n-1}',
            correct: true
          },
          {
            id: 'c',
            latex: "\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}",
            correct: false,
            misconception:
              'There is no variable denominator here; every term is a straightforward polynomial power.'
          },
          {
            id: 'd',
            latex: "\\frac{d}{dx}g(u(x)) = g'(u)\\cdot u'(x)",
            correct: false,
            misconception:
              'There is no nested composite function here—each term differentiates directly with the power rule.'
          }
        ],
        lockedLabel: 'Rule',
        lockedResultLatex: '\\text{Linearity + Power Rule: } \\frac{d}{dx}(c\\,x^n) = c\\,n\\,x^{n-1}',
        hint: 'Sums and differences differentiate term-by-term, pulling each constant coefficient out front.'
      },
      {
        stepType: 'diff_part',
        badge: 'Higher Powers',
        prompt: 'Apply the power rule to the first two terms: $\\frac{d}{dx}(4x^3 - 6x^2)$.',
        highlightLatex:
          '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{4x^{\\textcolor{#F59E0B}{3}}} - \\textcolor{#22D3EE}{6x^{\\textcolor{#F59E0B}{2}}}\\right)',
        options: [
          {
            id: 'a',
            latex: '12x^2 - 12x',
            correct: true
          },
          {
            id: 'b',
            latex: '12x^3 - 12x^2',
            correct: false,
            misconception:
              'You multiplied by each exponent, but forgot to subtract $1$ from each power ($n \\to n - 1$).'
          },
          {
            id: 'c',
            latex: '4x^2 - 6x',
            correct: false,
            misconception:
              'You lowered the exponents, but forgot to bring each original exponent down as a multiplier.'
          },
          {
            id: 'd',
            latex: '12x^2 - 6x',
            correct: false,
            misconception:
              'Check the second term: bringing down the exponent $2$ multiplies $-6$ to give $-12x$, not $-6x$.'
          }
        ],
        lockedLabel: 'First Terms',
        lockedResultLatex: '\\frac{d}{dx}(4x^3 - 6x^2) = \\textcolor{#34D399}{12x^2 - 12x}',
        hint: 'Bring down the exponent to multiply the coefficient, then reduce the exponent by 1: $4(3)x^2 - 6(2)x^1$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Linear & Constant',
        prompt: 'Now differentiate the linear and constant terms: $\\frac{d}{dx}(5x - 8)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{5x} - \\textcolor{#F59E0B}{8}\\right)',
        options: [
          {
            id: 'a',
            latex: '5x - 8',
            correct: false,
            misconception:
              'Differentiating $5x$ yields its constant slope $5$, and the constant $-8$ has zero rate of change.'
          },
          {
            id: 'b',
            latex: '5 - 8',
            correct: false,
            misconception:
              'A standalone constant has zero slope—its derivative is $0$, not $-8$.'
          },
          {
            id: 'c',
            latex: '5 + 0 = 5',
            correct: true
          },
          {
            id: 'd',
            latex: '0',
            correct: false,
            misconception:
              'While $\\frac{d}{dx}(-8) = 0$, the linear term $5x$ has a non-zero slope of $5$.'
          }
        ],
        lockedLabel: 'Linear & Const',
        lockedResultLatex: '\\frac{d}{dx}(5x - 8) = \\textcolor{#34D399}{5}',
        hint: 'A line $5x$ has constant slope $5$, while a flat constant $-8$ has slope $0$.'
      },
      {
        stepType: 'assemble',
        badge: 'Combine Result',
        prompt: "Combine all differentiated terms into the final expression for $f'(x)$.",
        highlightLatex: "f'(x) = \\textcolor{#34D399}{(12x^2 - 12x)} + \\textcolor{#34D399}{5}",
        options: [
          {
            id: 'a',
            latex: '12x^2 - 12x + 5 - 8',
            correct: false,
            misconception: 'Remember that the constant $-8$ vanished to $0$ when differentiated.'
          },
          {
            id: 'b',
            latex: '12x^2 - 12x',
            correct: false,
            misconception: 'Do not drop the $+5$ from differentiating $5x$.'
          },
          {
            id: 'c',
            latex: '12x^2 + 12x + 5',
            correct: false,
            misconception:
              'Watch the sign on the quadratic term: $-6x^2$ differentiates to $-12x$, preserving the minus sign.'
          },
          {
            id: 'd',
            latex: '12x^2 - 12x + 5',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{12x^2 - 12x + 5}",
        hint: 'Simply sum the two locked sub-results from the ledger above.'
      }
    ]
  },

  {
    id: 'prob-02-fractional-negative-powers',
    tier: 'power',
    tierLabel: 'Power & Linearity',
    title: 'Fractional & Inverse-Square Powers',
    mechatronicsContext:
      'Inverse-square field laws ($r^{-2}$) and non-linear damper curves ($x^{5/2}$) both yield cleanly to negative and fractional power rules.',
    expressionLatex: 'f(x) = 2x^{5/2} - \\frac{3}{x^2}',
    finalAnswerLatex: "f'(x) = 5x^{3/2} + \\frac{6}{x^3}",
    domain: [0.5, 4],
    verifyFn: (x) => 2 * Math.pow(x, 2.5) - 3 / (x * x),
    verifyDerivFn: (x) => 5 * Math.pow(x, 1.5) + 6 / (x * x * x),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Rewrite as Powers',
        prompt: 'Rewrite $\\frac{3}{x^2}$ using a negative exponent so both terms fit the power rule.',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{2x^{5/2}} - \\textcolor{#F59E0B}{\\frac{3}{x^2}}',
        options: [
          {
            id: 'a',
            latex: '2x^{5/2} - 3x^2',
            correct: false,
            misconception:
              'Moving $x^2$ from the denominator to the numerator negates the exponent: $\\frac{1}{x^2} = x^{-2}$.'
          },
          {
            id: 'b',
            latex: '2x^{5/2} - 3x^{-2}',
            correct: true
          },
          {
            id: 'c',
            latex: '2x^{5/2} - x^{-6}',
            correct: false,
            misconception:
              'The constant $3$ stays out front as a multiplier; it does not multiply the exponent.'
          },
          {
            id: 'd',
            latex: '2x^{5/2} + 3x^{-2}',
            correct: false,
            misconception:
              'Rewriting $\\frac{1}{x^2}$ as $x^{-2}$ does not flip the minus sign in front of the term yet.'
          }
        ],
        lockedLabel: 'Power Form',
        lockedResultLatex: 'f(x) = \\textcolor{#22D3EE}{2x^{5/2}} - \\textcolor{#F59E0B}{3x^{-2}}',
        hint: 'Use the reciprocal exponent identity $\\frac{1}{x^k} = x^{-k}$ while keeping the leading $-3$ unchanged.'
      },
      {
        stepType: 'diff_part',
        badge: 'Fractional Power',
        prompt: 'Differentiate the fractional power term: $\\frac{d}{dx}(2x^{5/2})$.',
        highlightLatex:
          '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{2x^{\\textcolor{#F59E0B}{5/2}}}\\right)',
        options: [
          {
            id: 'a',
            latex: '5x^{5/2}',
            correct: false,
            misconception:
              'Remember to subtract $1$ from the exponent: $\\frac{5}{2} - 1 = \\frac{3}{2}$.'
          },
          {
            id: 'b',
            latex: '5x^{7/2}',
            correct: false,
            misconception:
              'Differentiation subtracts $1$ from the exponent ($\\frac{5}{2} - 1 = \\frac{3}{2}$); adding $1$ is for integration.'
          },
          {
            id: 'c',
            latex: '5x^{3/2}',
            correct: true
          },
          {
            id: 'd',
            latex: '\\frac{5}{2}x^{3/2}',
            correct: false,
            misconception:
              'Do not forget to multiply by the leading coefficient $2$: $2 \\cdot \\frac{5}{2} = 5$.'
          }
        ],
        lockedLabel: 'Term 1 Deriv',
        lockedResultLatex: '\\frac{d}{dx}(2x^{5/2}) = \\textcolor{#34D399}{5x^{3/2}}',
        hint: 'Multiply $2 \\cdot \\frac{5}{2} = 5$, and subtract $\\frac{2}{2}$ from the exponent $\\frac{5}{2}$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Negative Power',
        prompt: 'Differentiate the negative power term carefully: $\\frac{d}{dx}(-3x^{-2})$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{-3x^{-2}}\\right)',
        options: [
          {
            id: 'a',
            latex: '+6x^{-3}',
            correct: true
          },
          {
            id: 'b',
            latex: '-6x^{-3}',
            correct: false,
            misconception:
              'Double negative! Multiplying $-3$ by the exponent $-2$ produces $+6$, not $-6$.'
          },
          {
            id: 'c',
            latex: '+6x^{-1}',
            correct: false,
            misconception:
              'Be careful subtracting $1$ from a negative exponent: $-2 - 1 = -3$, not $-1$!'
          },
          {
            id: 'd',
            latex: '-6x^{-1}',
            correct: false,
            misconception:
              'Two sign slips: $(-3)(-2) = +6$ and the new exponent is $-2 - 1 = -3$.'
          }
        ],
        lockedLabel: 'Term 2 Deriv',
        lockedResultLatex: '\\frac{d}{dx}(-3x^{-2}) = \\textcolor{#34D399}{+6x^{-3}}',
        hint: 'Bring down $-2$ to multiply $-3$ (giving $+6$), and step the exponent down by 1: $-2 - 1 = -3$.'
      },
      {
        stepType: 'simplify',
        badge: 'Positive Exponents',
        prompt: 'Combine both derivatives and rewrite $6x^{-3}$ back in fraction form.',
        highlightLatex: "f'(x) = \\textcolor{#34D399}{5x^{3/2}} + \\textcolor{#34D399}{6x^{-3}}",
        options: [
          {
            id: 'a',
            latex: '5x^{3/2} - \\frac{6}{x^3}',
            correct: false,
            misconception:
              'Moving $x^{-3}$ to the denominator keeps the $+$ sign; it does not negate the fraction.'
          },
          {
            id: 'b',
            latex: '5x^{3/2} + \\frac{6}{x}',
            correct: false,
            misconception: 'The exponent is $-3$, so the denominator is $x^3$.'
          },
          {
            id: 'c',
            latex: '5x^{3/2} + \\frac{1}{6x^3}',
            correct: false,
            misconception:
              'Only $x^{-3}$ moves to the denominator; the coefficient $6$ stays in the numerator.'
          },
          {
            id: 'd',
            latex: '5x^{3/2} + \\frac{6}{x^3}',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{5x^{3/2} + \\frac{6}{x^3}}",
        hint: 'Replace $x^{-3}$ with $\\frac{1}{x^3}$ while keeping $6$ in the numerator.'
      }
    ]
  },

  // =========================================================================
  // TIER 2: TRIG & EXP
  // =========================================================================
  {
    id: 'prob-03-trig-exp-combo',
    tier: 'trig-exp',
    tierLabel: 'Trig & Exp',
    title: 'Harmonic & Exponential Response',
    mechatronicsContext:
      'Sinusoidal oscillations combined with exponential growth or decay appear in every RLC circuit and spring-damper response.',
    expressionLatex: 'f(x) = 3\\sin(x) - 4\\cos(x) + 2e^x',
    finalAnswerLatex: "f'(x) = 3\\cos(x) + 4\\sin(x) + 2e^x",
    domain: [-2.5, 2.5],
    verifyFn: (x) => 3 * Math.sin(x) - 4 * Math.cos(x) + 2 * Math.exp(x),
    verifyDerivFn: (x) => 3 * Math.cos(x) + 4 * Math.sin(x) + 2 * Math.exp(x),
    steps: [
      {
        stepType: 'diff_part',
        badge: 'Sine Term',
        prompt: 'Differentiate the first harmonic term: $\\frac{d}{dx}\\big(3\\sin(x)\\big)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{3\\sin(x)}\\right)',
        options: [
          {
            id: 'a',
            latex: '-3\\cos(x)',
            correct: false,
            misconception:
              '$\\frac{d}{dx}\\sin(x) = +\\cos(x)$ (the negative sign appears when differentiating $\\cos(x)$, not $\\sin(x)$).'
          },
          {
            id: 'b',
            latex: '3\\sin(x)',
            correct: false,
            misconception:
              'Sine is not its own derivative—its slope shifts $90^\\circ$ in phase to $\\cos(x)$.'
          },
          {
            id: 'c',
            latex: '3\\cos(x)',
            correct: true
          },
          {
            id: 'd',
            latex: '\\cos(3x)',
            correct: false,
            misconception:
              'The constant $3$ multiplies the outside of $\\sin(x)$, so it remains an outside multiplier.'
          }
        ],
        lockedLabel: 'Sine Deriv',
        lockedResultLatex: '\\frac{d}{dx}\\big(3\\sin(x)\\big) = \\textcolor{#34D399}{3\\cos(x)}',
        hint: 'At $x = 0$, $\\sin(x)$ rises with slope $+1 = \\cos(0)$, so $\\frac{d}{dx}\\sin(x) = +\\cos(x)$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Cosine Sign Flip',
        prompt: 'Differentiate $-4\\cos(x)$ carefully—watch the sign of $\\frac{d}{dx}\\cos(x)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{-4\\cos(x)}\\right)',
        options: [
          {
            id: 'a',
            latex: '-4\\sin(x)',
            correct: false,
            misconception:
              'Sign error! Since $\\frac{d}{dx}\\cos(x) = -\\sin(x)$, we get $-4(-\\sin x) = +4\\sin(x)$.'
          },
          {
            id: 'b',
            latex: '+4\\sin(x)',
            correct: true
          },
          {
            id: 'c',
            latex: '+4\\cos(x)',
            correct: false,
            misconception:
              'Differentiating $\\cos(x)$ switches the trig function to $-\\sin(x)$.'
          },
          {
            id: 'd',
            latex: '-4\\sec^2(x)',
            correct: false,
            misconception:
              '$\\sec^2(x)$ is the derivative of $\\tan(x)$, whereas $\\frac{d}{dx}\\cos(x) = -\\sin(x)$.'
          }
        ],
        lockedLabel: 'Cosine Deriv',
        lockedResultLatex: '\\frac{d}{dx}\\big(-4\\cos(x)\\big) = \\textcolor{#34D399}{+4\\sin(x)}',
        hint: 'Multiply the leading $-4$ by $-\\sin(x)$: two negatives cancel to $+4\\sin(x)$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Exponential Term',
        prompt: 'Differentiate the natural exponential term: $\\frac{d}{dx}(2e^x)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{2e^x}\\right)',
        options: [
          {
            id: 'a',
            latex: '2e^x',
            correct: true
          },
          {
            id: 'b',
            latex: '2x\\,e^{x-1}',
            correct: false,
            misconception:
              'Do NOT use the power rule on $e^x$! The variable is in the exponent, and $e^x$ is its own derivative.'
          },
          {
            id: 'c',
            latex: 'e^x',
            correct: false,
            misconception:
              'Keep the constant multiplier $2$ by linearity: $\\frac{d}{dx}(2e^x) = 2e^x$.'
          },
          {
            id: 'd',
            latex: '2e^{x-1}',
            correct: false,
            misconception:
              'Unlike $x^n$, the exponent of $e^x$ does not decrease by $1$ when differentiated.'
          }
        ],
        lockedLabel: 'Exp Deriv',
        lockedResultLatex: '\\frac{d}{dx}(2e^x) = \\textcolor{#34D399}{2e^x}',
        hint: 'The defining property of Euler’s number $e$ is that $\\frac{d}{dx}(e^x) = e^x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Derivative',
        prompt: "Combine all three derivatives into $f'(x)$.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{3\\cos(x)} + \\textcolor{#34D399}{4\\sin(x)} + \\textcolor{#34D399}{2e^x}",
        options: [
          {
            id: 'a',
            latex: '3\\cos(x) - 4\\sin(x) + 2e^x',
            correct: false,
            misconception: 'Check the middle sign: $-4\\cdot(-\\sin x) = +4\\sin(x)$.'
          },
          {
            id: 'b',
            latex: '-3\\cos(x) + 4\\sin(x) + 2e^x',
            correct: false,
            misconception: 'The derivative of $+3\\sin(x)$ is positive $+3\\cos(x)$.'
          },
          {
            id: 'c',
            latex: '3\\cos(x) + 4\\sin(x) + 2x\\,e^{x-1}',
            correct: false,
            misconception: 'The natural exponential remains $2e^x$.'
          },
          {
            id: 'd',
            latex: '3\\cos(x) + 4\\sin(x) + 2e^x',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{3\\cos(x) + 4\\sin(x) + 2e^x}",
        hint: 'Add the three locked results from the Step Ledger directly.'
      }
    ]
  },

  {
    id: 'prob-04-log-tan',
    tier: 'trig-exp',
    tierLabel: 'Trig & Exp',
    title: 'Logarithmic Gain & Tangent Slope',
    mechatronicsContext:
      'Bode plots measure gain on logarithmic scales ($\\ln x$) while phase-margin geometry frequently involves $\\tan(x)$.',
    expressionLatex: 'f(x) = 5\\ln(x) + 2\\tan(x)',
    finalAnswerLatex: "f'(x) = \\frac{5}{x} + 2\\sec^2(x)",
    domain: [0.3, 1.3],
    verifyFn: (x) => 5 * Math.log(x) + 2 * Math.tan(x),
    verifyDerivFn: (x) => 5 / x + 2 / (Math.cos(x) * Math.cos(x)),
    steps: [
      {
        stepType: 'diff_part',
        badge: 'Natural Log Term',
        prompt: 'Differentiate the natural logarithm term: $\\frac{d}{dx}\\big(5\\ln(x)\\big)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{5\\ln(x)}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{5x}',
            correct: false,
            misconception:
              'The constant $5$ multiplies the whole derivative: $5 \\cdot \\frac{1}{x} = \\frac{5}{x}$, not $\\frac{1}{5x}$.'
          },
          {
            id: 'b',
            latex: '\\frac{5}{x}',
            correct: true
          },
          {
            id: 'c',
            latex: '5e^x',
            correct: false,
            misconception:
              '$e^x$ is the inverse function of $\\ln(x)$, not its derivative—$\\frac{d}{dx}\\ln(x) = \\frac{1}{x}$.'
          },
          {
            id: 'd',
            latex: '-\\frac{5}{x^2}',
            correct: false,
            misconception:
              'That is the second derivative (the derivative of $\\frac{5}{x}$)! First derivative is $\\frac{5}{x}$.'
          }
        ],
        lockedLabel: 'Log Deriv',
        lockedResultLatex: '\\frac{d}{dx}\\big(5\\ln(x)\\big) = \\textcolor{#34D399}{\\frac{5}{x}}',
        hint: 'Use $\\frac{d}{dx}\\ln(x) = \\frac{1}{x}$ and multiply by the constant $5$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Tangent Term',
        prompt: 'Differentiate the tangent term: $\\frac{d}{dx}\\big(2\\tan(x)\\big)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{2\\tan(x)}\\right)',
        options: [
          {
            id: 'a',
            latex: '2\\cot(x)',
            correct: false,
            misconception:
              '$\\cot(x)$ is the reciprocal of $\\tan(x)$, not its derivative. Recall $\\frac{d}{dx}\\tan(x) = \\sec^2(x)$.'
          },
          {
            id: 'b',
            latex: '2\\sec(x)\\tan(x)',
            correct: false,
            misconception:
              '$\\sec(x)\\tan(x)$ is the derivative of $\\sec(x)$, whereas $\\frac{d}{dx}\\tan(x) = \\sec^2(x)$.'
          },
          {
            id: 'c',
            latex: '-2\\csc^2(x)',
            correct: false,
            misconception:
              '$-\\csc^2(x)$ is the derivative of $\\cot(x)$, not $\\tan(x)$.'
          },
          {
            id: 'd',
            latex: '2\\sec^2(x)',
            correct: true
          }
        ],
        lockedLabel: 'Tan Deriv',
        lockedResultLatex: '\\frac{d}{dx}\\big(2\\tan(x)\\big) = \\textcolor{#34D399}{2\\sec^2(x)}',
        hint: 'Because $\\tan(x) = \\frac{\\sin x}{\\cos x}$, the quotient rule yields $\\frac{\\cos^2 x + \\sin^2 x}{\\cos^2 x} = \\sec^2(x)$.'
      },
      {
        stepType: 'assemble',
        badge: 'Combine Result',
        prompt: "Combine both derivatives to complete $f'(x)$.",
        highlightLatex: "f'(x) = \\textcolor{#34D399}{\\frac{5}{x}} + \\textcolor{#34D399}{2\\sec^2(x)}",
        options: [
          {
            id: 'a',
            latex: '\\frac{5}{x} + 2\\sec^2(x)',
            correct: true
          },
          {
            id: 'b',
            latex: '\\frac{1}{5x} + 2\\sec^2(x)',
            correct: false,
            misconception: 'Keep $5$ in the numerator: $5 \\cdot \\frac{1}{x} = \\frac{5}{x}$.'
          },
          {
            id: 'c',
            latex: '\\frac{5}{x} + 2\\sec(x)',
            correct: false,
            misconception: 'Do not drop the exponent on $\\sec^2(x)$!'
          },
          {
            id: 'd',
            latex: '5\\ln(x) + 2\\sec^2(x)',
            correct: false,
            misconception: 'Remember to replace $5\\ln(x)$ with its derivative $\\frac{5}{x}$.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{5}{x} + 2\\sec^2(x)}",
        hint: 'Add the two derivatives locked in the Step Ledger.'
      }
    ]
  },

  // =========================================================================
  // TIER 3: PRODUCT RULE
  // =========================================================================
  {
    id: 'prob-05-product-poly-sin',
    tier: 'product',
    tierLabel: 'Product Rule',
    title: 'Modulated Polynomial Wave',
    mechatronicsContext:
      'Amplitude-modulated signals multiply a time-varying envelope $u(t)$ by a carrier oscillation $v(t)$.',
    expressionLatex: 'f(x) = x^3 \\sin(x)',
    finalAnswerLatex: "f'(x) = 3x^2\\sin(x) + x^3\\cos(x)",
    domain: [-2.5, 2.5],
    verifyFn: (x) => x ** 3 * Math.sin(x),
    verifyDerivFn: (x) => 3 * x ** 2 * Math.sin(x) + x ** 3 * Math.cos(x),
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Identify Rule',
        prompt: 'Two $x$-dependent factors are multiplied together. Select the correct rule.',
        highlightLatex: 'f(x) = \\textcolor{#22D3EE}{x^3} \\cdot \\textcolor{#F59E0B}{\\sin(x)}',
        options: [
          {
            id: 'a',
            latex: "(u\\cdot v)' = u' \\cdot v'",
            correct: false,
            misconception:
              "Classic trap! The derivative of a product is NOT the product of the derivatives ($u'v'$)."
          },
          {
            id: 'b',
            latex: "(u\\cdot v)' = u'v - uv'",
            correct: false,
            misconception:
              "The Product Rule uses a PLUS sign ($u'v + uv'$); the minus sign belongs in the Quotient Rule."
          },
          {
            id: 'c',
            latex: "(u\\cdot v)' = u'v + uv'",
            correct: true
          },
          {
            id: 'd',
            latex: "\\frac{d}{dx}u(v) = u'(v)\\cdot v'",
            correct: false,
            misconception:
              'These two functions are multiplied side-by-side rather than nested inside each other.'
          }
        ],
        lockedLabel: 'Rule',
        lockedResultLatex:
          "\\text{Product Rule: } (\\textcolor{#22D3EE}{u}\\textcolor{#F59E0B}{v})' = \\textcolor{#22D3EE}{u'}\\textcolor{#F59E0B}{v} + \\textcolor{#22D3EE}{u}\\textcolor{#F59E0B}{v'}",
        hint: 'When a rectangle of sides $u$ and $v$ grows, its area changes by $u\'v + uv\'$.'
      },
      {
        stepType: 'decompose',
        badge: 'Decompose u & v',
        prompt: 'Assign the two original factors $u$ and $v$.',
        highlightLatex: 'f(x) = \\textcolor{#22D3EE}{x^3} \\cdot \\textcolor{#F59E0B}{\\sin(x)}',
        options: [
          {
            id: 'a',
            latex: 'u = x^3, \\quad v = \\sin(x)',
            correct: true
          },
          {
            id: 'b',
            latex: 'u = x, \\quad v = \\sin^3(x)',
            correct: false,
            misconception: 'The cube applies to $x$, not to $\\sin(x)$.'
          },
          {
            id: 'c',
            latex: 'u = 3x^2, \\quad v = \\cos(x)',
            correct: false,
            misconception:
              "Those are the derivatives $u'$ and $v'$—first lock in the original factors $u$ and $v$."
          },
          {
            id: 'd',
            latex: 'u = x^3\\sin(x), \\quad v = x',
            correct: false,
            misconception:
              'Split cleanly between the algebraic factor $x^3$ and the trig factor $\\sin(x)$.'
          }
        ],
        lockedLabel: 'Factors',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x^3}, \\quad \\textcolor{#F59E0B}{v = \\sin(x)}',
        hint: 'Match the Cyan factor to $u$ and the Amber factor to $v$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "Compute the individual derivatives $u'$ and $v'$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = x^3} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = \\sin(x)} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = 3x^2, \\quad v' = -\\cos(x)",
            correct: false,
            misconception: 'Sign check: $\\frac{d}{dx}\\sin(x) = +\\cos(x)$.'
          },
          {
            id: 'b',
            latex: "u' = x^2, \\quad v' = \\cos(x)",
            correct: false,
            misconception: "Do not forget the factor of $3$ from the power rule on $x^3$: $u' = 3x^2$."
          },
          {
            id: 'c',
            latex: "u' = 3x^3, \\quad v' = \\cos(x)",
            correct: false,
            misconception: 'Lower the exponent of $x^3$ by $1$ to get $3x^2$.'
          },
          {
            id: 'd',
            latex: "u' = 3x^2, \\quad v' = \\cos(x)",
            correct: true
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex: "\\textcolor{#34D399}{u' = 3x^2}, \\quad \\textcolor{#34D399}{v' = \\cos(x)}",
        hint: 'Apply the power rule to $x^3$ and recall $\\frac{d}{dx}\\sin(x) = \\cos(x)$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Product',
        prompt: "Substitute $u, v, u', v'$ into $f'(x) = u'v + uv'$.",
        highlightLatex:
          "f'(x) = (\\textcolor{#34D399}{3x^2})(\\textcolor{#F59E0B}{\\sin x}) + (\\textcolor{#22D3EE}{x^3})(\\textcolor{#34D399}{\\cos x})",
        options: [
          {
            id: 'a',
            latex: '3x^2\\cos(x)',
            correct: false,
            misconception:
              "That multiplies $u'\\cdot v'$, omitting both cross-terms of the product rule!"
          },
          {
            id: 'b',
            latex: '3x^2\\sin(x) + x^3\\cos(x)',
            correct: true
          },
          {
            id: 'c',
            latex: '3x^2\\sin(x) - x^3\\cos(x)',
            correct: false,
            misconception: 'The Product Rule adds the two cross-terms with a $+$ sign.'
          },
          {
            id: 'd',
            latex: '3x^2\\cos(x) + x^3\\sin(x)',
            correct: false,
            misconception:
              "Check the cross-pairing: $u'$ pairs with $v$ ($\\sin x$), and $u$ pairs with $v'$ ($\\cos x$)."
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{3x^2\\sin(x) + x^3\\cos(x)}",
        hint: 'Follow the color pairs: $(3x^2)(\\sin x) + (x^3)(\\cos x)$.'
      }
    ]
  },

  {
    id: 'prob-06-product-quad-exp',
    tier: 'product',
    tierLabel: 'Product Rule',
    title: 'Quadratic-Exponential Impulse',
    mechatronicsContext:
      'Critically damped system responses often take the form $(at^2 + b)e^{rt}$, requiring Product Rule plus factoring out $e^x$.',
    expressionLatex: 'f(x) = (2x^2 + 1)e^x',
    finalAnswerLatex: "f'(x) = (2x^2 + 4x + 1)e^x",
    domain: [-2.5, 1.5],
    verifyFn: (x) => (2 * x * x + 1) * Math.exp(x),
    verifyDerivFn: (x) => (2 * x * x + 4 * x + 1) * Math.exp(x),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Decompose u & v',
        prompt: 'Split the product $(2x^2 + 1)e^x$ into factors $u$ and $v$.',
        highlightLatex: 'f(x) = \\textcolor{#22D3EE}{(2x^2 + 1)} \\cdot \\textcolor{#F59E0B}{e^x}',
        options: [
          {
            id: 'a',
            latex: 'u = 2x^2, \\quad v = e^x',
            correct: false,
            misconception: 'Keep the entire parenthesized binomial together: $u = 2x^2 + 1$.'
          },
          {
            id: 'b',
            latex: 'u = 2x^2 + 1, \\quad v = e^x',
            correct: true
          },
          {
            id: 'c',
            latex: 'u = 4x, \\quad v = e^x',
            correct: false,
            misconception:
              "$4x$ is already the derivative $u'$—first identify the original factor $u = 2x^2 + 1$."
          },
          {
            id: 'd',
            latex: 'u = e^x, \\quad v = 2x^2',
            correct: false,
            misconception: 'You dropped the $+1$ inside the parentheses.'
          }
        ],
        lockedLabel: 'Factors',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = 2x^2 + 1}, \\quad \\textcolor{#F59E0B}{v = e^x}',
        hint: 'Take the polynomial factor inside parentheses as $u$, and the exponential as $v$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "Differentiate $u = 2x^2 + 1$ and $v = e^x$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = 2x^2 + 1} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = e^x} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = 4x, \\quad v' = e^x",
            correct: true
          },
          {
            id: 'b',
            latex: "u' = 4x + 1, \\quad v' = e^x",
            correct: false,
            misconception: 'The derivative of the constant $+1$ is $0$, not $1$.'
          },
          {
            id: 'c',
            latex: "u' = 4x, \\quad v' = x\\,e^{x-1}",
            correct: false,
            misconception:
              '$\\frac{d}{dx}(e^x) = e^x$—never apply the power rule to an exponential function.'
          },
          {
            id: 'd',
            latex: "u' = 2x, \\quad v' = e^x",
            correct: false,
            misconception: 'Bring down the exponent $2$: $2 \\cdot 2x = 4x$.'
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex: "\\textcolor{#34D399}{u' = 4x}, \\quad \\textcolor{#34D399}{v' = e^x}",
        hint: 'Differentiate $2x^2 + 1$ with the power rule, and recall $e^x$ stays $e^x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Product',
        prompt: "Plug $u, v, u', v'$ into $u'v + uv'$.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{4x}\\,\\textcolor{#F59E0B}{e^x} + \\textcolor{#22D3EE}{(2x^2 + 1)}\\,\\textcolor{#34D399}{e^x}",
        options: [
          {
            id: 'a',
            latex: '4x\\,e^x',
            correct: false,
            misconception:
              "That is only $u'v$; you still need to add $+ uv' = (2x^2 + 1)e^x$."
          },
          {
            id: 'b',
            latex: '4x\\,e^x - (2x^2 + 1)e^x',
            correct: false,
            misconception: 'The Product Rule adds the two terms with a $+$ sign.'
          },
          {
            id: 'c',
            latex: '4x\\,e^x + (2x^2 + 1)e^x',
            correct: true
          },
          {
            id: 'd',
            latex: '4x(2x^2 + 1) + e^x',
            correct: false,
            misconception: 'Both terms in $u\'v + uv\'$ must be multiplied by $e^x$.'
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = 4x\\,e^x + (2x^2 + 1)e^x",
        hint: 'Read straight from the color-coded template: $u\'v + uv\'$.'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Out e^x',
        prompt: 'Factor out the common $e^x$ and write the quadratic in standard descending order.',
        highlightLatex:
          '\\big(\\textcolor{#34D399}{4x} + \\textcolor{#22D3EE}{2x^2 + 1}\\big)\\,\\textcolor{#F59E0B}{e^x}',
        options: [
          {
            id: 'a',
            latex: '(2x^2 + 4x)e^x',
            correct: false,
            misconception: 'Do not drop the $+1$ from $(2x^2 + 1)$!'
          },
          {
            id: 'b',
            latex: '(2x^2 + 4x + 1)e^{2x}',
            correct: false,
            misconception:
              'Factoring $e^x$ out of a sum keeps a single $e^x$ (it only becomes $e^{2x}$ when multiplied!).'
          },
          {
            id: 'c',
            latex: '(6x^2 + 1)e^x',
            correct: false,
            misconception:
              '$2x^2$ and $4x$ have different powers of $x$, so keep them separate as $2x^2 + 4x + 1$.'
          },
          {
            id: 'd',
            latex: '(2x^2 + 4x + 1)e^x',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{(2x^2 + 4x + 1)e^x}",
        hint: 'Pull out one shared $e^x$ and sort the remaining terms: $2x^2$, then $4x$, then $+1$.'
      }
    ]
  },

  // =========================================================================
  // TIER 4: QUOTIENT RULE
  // =========================================================================
  {
    id: 'prob-07-quotient-rational',
    tier: 'quotient',
    tierLabel: 'Quotient Rule',
    title: 'Rational Transfer Function',
    mechatronicsContext:
      'Control-system transfer functions $H(s) = N(s)/D(s)$ are ratios of polynomials—the Quotient Rule computes their exact sensitivity.',
    expressionLatex: 'f(x) = \\frac{3x + 2}{x^2 + 1}',
    finalAnswerLatex: "f'(x) = \\frac{-3x^2 - 4x + 3}{(x^2 + 1)^2}",
    domain: [-3, 3],
    verifyFn: (x) => (3 * x + 2) / (x * x + 1),
    verifyDerivFn: (x) => (-3 * x * x - 4 * x + 3) / (x * x + 1) ** 2,
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Quotient Template',
        prompt: 'Select the exact Quotient Rule formula for $f(x) = \\frac{u}{v}$.',
        highlightLatex:
          'f(x) = \\frac{\\textcolor{#22D3EE}{u}}{\\textcolor{#F59E0B}{v}} = \\frac{\\textcolor{#22D3EE}{3x + 2}}{\\textcolor{#F59E0B}{x^2 + 1}}',
        options: [
          {
            id: 'a',
            latex: "\\frac{u'v - uv'}{v^2}",
            correct: true
          },
          {
            id: 'b',
            latex: "\\frac{uv' - u'v}{v^2}",
            correct: false,
            misconception:
              "Order matters with subtraction! It is always 'low d-high minus high d-low': $u'v - uv'$."
          },
          {
            id: 'c',
            latex: "\\frac{u'v + uv'}{v^2}",
            correct: false,
            misconception: 'The Quotient Rule uses a MINUS sign in the numerator, not a plus.'
          },
          {
            id: 'd',
            latex: "\\frac{u'}{v'}",
            correct: false,
            misconception:
              "You cannot divide the two derivatives directly—always use $\\frac{u'v - uv'}{v^2}$."
          }
        ],
        lockedLabel: 'Rule',
        lockedResultLatex:
          "\\left(\\frac{\\textcolor{#22D3EE}{u}}{\\textcolor{#F59E0B}{v}}\\right)' = \\frac{\\textcolor{#22D3EE}{u'}\\textcolor{#F59E0B}{v} - \\textcolor{#22D3EE}{u}\\textcolor{#F59E0B}{v'}}{\\textcolor{#F59E0B}{v}^2}",
        hint: 'Mnemonic: "Low d-High minus High d-Low, over Low squared."'
      },
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "Compute $u'$ and $v'$ for $u = 3x + 2$ and $v = x^2 + 1$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = 3x + 2} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = x^2 + 1} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = 3x, \\quad v' = 2x",
            correct: false,
            misconception: 'The derivative of $3x$ is the constant $3$, not $3x$.'
          },
          {
            id: 'b',
            latex: "u' = 3 + 2, \\quad v' = 2x + 1",
            correct: false,
            misconception: 'Constants ($+2$ and $+1$) differentiate to $0$.'
          },
          {
            id: 'c',
            latex: "u' = 3, \\quad v' = 2x",
            correct: true
          },
          {
            id: 'd',
            latex: "u' = 3, \\quad v' = x^2",
            correct: false,
            misconception: 'Apply the power rule to $x^2$: $\\frac{d}{dx}(x^2) = 2x$.'
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex: "\\textcolor{#34D399}{u' = 3}, \\quad \\textcolor{#34D399}{v' = 2x}",
        hint: 'Constants vanish: $\\frac{d}{dx}(3x+2) = 3$ and $\\frac{d}{dx}(x^2+1) = 2x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Fill Quotient Rule',
        prompt: "Substitute $u, v, u', v'$ into $\\frac{u'v - uv'}{v^2}$.",
        highlightLatex:
          '\\frac{(\\textcolor{#34D399}{3})(\\textcolor{#F59E0B}{x^2 + 1}) - (\\textcolor{#22D3EE}{3x + 2})(\\textcolor{#34D399}{2x})}{(\\textcolor{#F59E0B}{x^2 + 1})^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{(3x + 2)(2x) - 3(x^2 + 1)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              "Numerator terms are reversed! Start with $u'v = 3(x^2 + 1)$, then subtract $uv'$."
          },
          {
            id: 'b',
            latex: '\\frac{3(x^2 + 1) - (3x + 2)(2x)}{(x^2 + 1)^2}',
            correct: true
          },
          {
            id: 'c',
            latex: '\\frac{3(x^2 + 1) - (3x + 2)(2x)}{x^2 + 1}',
            correct: false,
            misconception: 'Do not forget to square the denominator: $(x^2 + 1)^2$.'
          },
          {
            id: 'd',
            latex: '\\frac{3(x^2 + 1) + (3x + 2)(2x)}{(x^2 + 1)^2}',
            correct: false,
            misconception: "Use subtraction ($-$) between $u'v$ and $uv'$ in the Quotient Rule."
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = \\frac{3(x^2 + 1) - (3x + 2)(2x)}{(x^2 + 1)^2}",
        hint: 'Match the green derivatives into $u\'v - uv\'$ and square the entire denominator.'
      },
      {
        stepType: 'simplify',
        badge: 'Expand Numerator',
        prompt: 'Expand the numerator carefully, distributing the minus sign across $(3x + 2)(2x)$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{3(x^2 + 1)} - \\textcolor{#F59E0B}{(3x + 2)(2x)}',
        options: [
          {
            id: 'a',
            latex: '3x^2 + 3 - 6x^2 + 4x',
            correct: false,
            misconception:
              'Sign distribution slip! Subtracting $(6x^2 + 4x)$ negates BOTH terms: $-6x^2 - 4x$.'
          },
          {
            id: 'b',
            latex: '3x^2 + 1 - 6x^2 - 4x',
            correct: false,
            misconception: 'Distribute $3$ to both terms inside $(x^2 + 1)$: $3\\cdot 1 = 3$, not $1$.'
          },
          {
            id: 'c',
            latex: '3x^2 + 3 - 5x^2 - 4x',
            correct: false,
            misconception: 'Check the multiplication: $(3x)(2x) = 6x^2$, not $5x^2$.'
          },
          {
            id: 'd',
            latex: '3x^2 + 3 - 6x^2 - 4x',
            correct: true
          }
        ],
        lockedLabel: 'Expanded Top',
        lockedResultLatex: '\\text{Numerator} = 3x^2 + 3 - 6x^2 - 4x',
        hint: 'First compute $(3x + 2)(2x) = 6x^2 + 4x$, then flip both signs because of the leading minus.'
      },
      {
        stepType: 'simplify',
        badge: 'Combine Like Terms',
        prompt: "Combine like terms in the numerator to finalize $f'(x)$.",
        highlightLatex:
          '\\frac{\\textcolor{#34D399}{(3x^2 - 6x^2) - 4x + 3}}{(x^2 + 1)^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{3x^2 - 4x + 3}{(x^2 + 1)^2}',
            correct: false,
            misconception: 'Check the $x^2$ subtraction: $3x^2 - 6x^2 = -3x^2$, not $+3x^2$.'
          },
          {
            id: 'b',
            latex: '\\frac{-3x^2 + 4x + 3}{(x^2 + 1)^2}',
            correct: false,
            misconception: 'Remember the minus sign distributed to $4x$, keeping $-4x$.'
          },
          {
            id: 'c',
            latex: '\\frac{-3x^2 - 4x + 3}{(x^2 + 1)^2}',
            correct: true
          },
          {
            id: 'd',
            latex: '\\frac{-3x^2 - 4x + 3}{x^4 + 1}',
            correct: false,
            misconception:
              '$(x^2 + 1)^2 \\neq x^4 + 1$—it is cleaner and safer to leave the denominator factored as $(x^2 + 1)^2$.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{-3x^2 - 4x + 3}{(x^2 + 1)^2}}",
        hint: 'Merge $3x^2 - 6x^2 = -3x^2$ and leave $(x^2 + 1)^2$ factored in the denominator.'
      }
    ]
  },

  {
    id: 'prob-08-quotient-sin-x2',
    tier: 'quotient',
    tierLabel: 'Quotient Rule',
    title: 'Attenuated Sine Pulse',
    mechatronicsContext:
      'Inverse-square geometric attenuation of a sinusoidal wavefront yields $\\sin(x)/x^2$—watch how a common factor of $x$ cancels cleanly.',
    expressionLatex: 'f(x) = \\frac{\\sin(x)}{x^2}',
    finalAnswerLatex: "f'(x) = \\frac{x\\cos(x) - 2\\sin(x)}{x^3}",
    domain: [0.6, 4.5],
    verifyFn: (x) => Math.sin(x) / (x * x),
    verifyDerivFn: (x) => (x * Math.cos(x) - 2 * Math.sin(x)) / (x * x * x),
    steps: [
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "With $u = \\sin(x)$ and $v = x^2$, compute $u'$ and $v'$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = \\sin(x)} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = x^2} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = -\\cos(x), \\quad v' = 2x",
            correct: false,
            misconception: 'Sign check: $\\frac{d}{dx}\\sin(x) = +\\cos(x)$.'
          },
          {
            id: 'b',
            latex: "u' = \\cos(x), \\quad v' = 2x",
            correct: true
          },
          {
            id: 'c',
            latex: "u' = \\cos(x), \\quad v' = x^2",
            correct: false,
            misconception: 'Differentiate the denominator as well: $\\frac{d}{dx}(x^2) = 2x$.'
          },
          {
            id: 'd',
            latex: "u' = \\sin(x), \\quad v' = 2x",
            correct: false,
            misconception: '$\\frac{d}{dx}\\sin(x) = \\cos(x)$, not $\\sin(x)$.'
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex: "\\textcolor{#34D399}{u' = \\cos(x)}, \\quad \\textcolor{#34D399}{v' = 2x}",
        hint: 'Differentiate the numerator $\\sin(x) \\to \\cos(x)$ and denominator $x^2 \\to 2x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Apply Quotient Rule',
        prompt: "Assemble $\\frac{u'v - uv'}{v^2}$ before simplifying.",
        highlightLatex:
          '\\frac{(\\textcolor{#34D399}{\\cos x})(\\textcolor{#F59E0B}{x^2}) - (\\textcolor{#22D3EE}{\\sin x})(\\textcolor{#34D399}{2x})}{(\\textcolor{#F59E0B}{x^2})^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{2x\\sin(x) - x^2\\cos(x)}{x^4}',
            correct: false,
            misconception:
              "Signs reversed! Start with $u'v = x^2\\cos(x)$ minus $uv' = 2x\\sin(x)$."
          },
          {
            id: 'b',
            latex: '\\frac{x^2\\cos(x) + 2x\\sin(x)}{x^4}',
            correct: false,
            misconception: "The Quotient Rule subtracts $uv'$ in the numerator."
          },
          {
            id: 'c',
            latex: '\\frac{x^2\\cos(x) - 2x\\sin(x)}{x^2}',
            correct: false,
            misconception: 'Square the denominator: $(x^2)^2 = x^4$.'
          },
          {
            id: 'd',
            latex: '\\frac{x^2\\cos(x) - 2x\\sin(x)}{x^4}',
            correct: true
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = \\frac{x^2\\cos(x) - 2x\\sin(x)}{x^4}",
        hint: 'Write $x^2\\cos(x) - 2x\\sin(x)$ over $(x^2)^2 = x^4$.'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Common x',
        prompt: 'Factor the greatest common power of $x$ out of the numerator.',
        highlightLatex:
          '\\frac{\\textcolor{#22D3EE}{x^2}\\cos(x) - 2\\textcolor{#22D3EE}{x}\\sin(x)}{x^4}',
        options: [
          {
            id: 'a',
            latex: '\\frac{x\\big(x\\cos(x) - 2\\sin(x)\\big)}{x^4}',
            correct: true
          },
          {
            id: 'b',
            latex: '\\frac{x^2\\big(\\cos(x) - 2\\sin(x)\\big)}{x^4}',
            correct: false,
            misconception:
              'The second term $2x\\sin(x)$ only carries a single $x$, so you can only factor out $x^1$.'
          },
          {
            id: 'c',
            latex: '\\frac{x\\big(x\\cos(x) - 2x\\sin(x)\\big)}{x^4}',
            correct: false,
            misconception: 'Once you factor $x$ out of $2x\\sin(x)$, only $2\\sin(x)$ remains inside.'
          },
          {
            id: 'd',
            latex: '\\frac{2x\\big(x\\cos(x) - \\sin(x)\\big)}{x^4}',
            correct: false,
            misconception: 'The first term $x^2\\cos(x)$ has no factor of $2$.'
          }
        ],
        lockedLabel: 'Factored',
        lockedResultLatex: "f'(x) = \\frac{x\\big(x\\cos(x) - 2\\sin(x)\\big)}{x^4}",
        hint: 'Both $x^2\\cos(x)$ and $-2x\\sin(x)$ share a single factor of $x$.'
      },
      {
        stepType: 'simplify',
        badge: 'Cancel Factor of x',
        prompt: 'Cancel the common factor of $x$ from numerator and denominator ($x \\neq 0$).',
        highlightLatex:
          '\\frac{\\textcolor{#F59E0B}{x}\\big(x\\cos(x) - 2\\sin(x)\\big)}{\\textcolor{#F59E0B}{x} \\cdot x^3}',
        options: [
          {
            id: 'a',
            latex: '\\frac{x\\cos(x) - 2\\sin(x)}{x^4}',
            correct: false,
            misconception: 'Reduce the denominator power too: $\\frac{x}{x^4} = \\frac{1}{x^3}$.'
          },
          {
            id: 'b',
            latex: '\\frac{\\cos(x) - 2\\sin(x)}{x^2}',
            correct: false,
            misconception:
              'You cannot cancel a second $x$ because $2\\sin(x)$ has no $x$ factor to cancel.'
          },
          {
            id: 'c',
            latex: '\\frac{x\\cos(x) - 2\\sin(x)}{x^3}',
            correct: true
          },
          {
            id: 'd',
            latex: '\\frac{x\\cos(x) + 2\\sin(x)}{x^3}',
            correct: false,
            misconception: 'Preserve the minus sign between $x\\cos(x)$ and $2\\sin(x)$.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{x\\cos(x) - 2\\sin(x)}{x^3}}",
        hint: 'Cancel one $x$ from top and bottom so $x^4$ drops to $x^3$.'
      }
    ]
  },

  // =========================================================================
  // TIER 5: CHAIN & COMBO
  // =========================================================================
  {
    id: 'prob-09-chain-power',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Nested Polynomial Power',
    mechatronicsContext:
      'Backpropagation in neural networks is the Chain Rule in action: outer layer sensitivity multiplied by inner gradient.',
    expressionLatex: 'f(x) = (3x^2 + 4)^5',
    finalAnswerLatex: "f'(x) = 30x(3x^2 + 4)^4",
    domain: [-1.2, 1.2],
    verifyFn: (x) => Math.pow(3 * x * x + 4, 5),
    verifyDerivFn: (x) => 30 * x * Math.pow(3 * x * x + 4, 4),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Peel Outer & Inner',
        prompt: 'Separate $(3x^2 + 4)^5$ into its Outer shell $g(u)$ and Inner core $u(x)$.',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{\\big(}\\textcolor{#F59E0B}{3x^2 + 4}\\textcolor{#22D3EE}{\\big)^5}',
        options: [
          {
            id: 'a',
            latex: '\\text{Outer: } 3u^2 + 4, \\quad \\text{Inner: } u = x^5',
            correct: false,
            misconception:
              'Inverted! Adding $4$ happens BEFORE raising to the 5th power, so $(\\cdot)^5$ is the outer shell.'
          },
          {
            id: 'b',
            latex: '\\text{Outer: } u^5, \\quad \\text{Inner: } u = 3x^2 + 4',
            correct: true
          },
          {
            id: 'c',
            latex: '\\text{Outer: } 5u^4, \\quad \\text{Inner: } u = 6x',
            correct: false,
            misconception:
              'Those are already the derivatives—first identify the original outer and inner functions.'
          },
          {
            id: 'd',
            latex: '\\text{Outer: } (3u + 4)^5, \\quad \\text{Inner: } u = x^2',
            correct: false,
            misconception:
              'Peel the outermost layer $u^5$ so the inner polynomial $3x^2 + 4$ differentiates cleanly in one step.'
          }
        ],
        lockedLabel: 'Outer & Inner',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{\\text{Outer: } u^5}, \\quad \\textcolor{#F59E0B}{\\text{Inner: } u = 3x^2 + 4}',
        hint: 'Ask which operation happens LAST when evaluating $f(x)$—raising to the 5th power.'
      },
      {
        stepType: 'diff_part',
        badge: 'Outer Derivative',
        prompt: 'Differentiate the outer shell $u^5$ with respect to $u$, keeping the inner expression intact.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\frac{d}{du}(u^5)}\\Big|_{u = \\textcolor{#F59E0B}{3x^2 + 4}}',
        options: [
          {
            id: 'a',
            latex: '5(3x^2 + 4)^4',
            correct: true
          },
          {
            id: 'b',
            latex: '5(6x)^4',
            correct: false,
            misconception:
              'Never differentiate the inside AT THE SAME TIME! Keep the original $(3x^2 + 4)$ inside $5(\\cdot)^4$.'
          },
          {
            id: 'c',
            latex: '5(3x^2 + 4)^5',
            correct: false,
            misconception: 'Lower the outer exponent by $1$: $5 - 1 = 4$.'
          },
          {
            id: 'd',
            latex: '(3x^2 + 4)^4',
            correct: false,
            misconception: 'Bring the outer exponent $5$ down in front.'
          }
        ],
        lockedLabel: 'Outer Deriv',
        lockedResultLatex:
          "g'(u) = \\textcolor{#34D399}{5}(\\textcolor{#F59E0B}{3x^2 + 4})^{\\textcolor{#34D399}{4}}",
        hint: 'Treat $(3x^2 + 4)$ as a sealed box $u$: $\\frac{d}{du}(u^5) = 5u^4$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Inner Derivative',
        prompt: 'Now differentiate the inner core $u = 3x^2 + 4$ with respect to $x$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{3x^2 + 4}\\right)',
        options: [
          {
            id: 'a',
            latex: '6x + 4',
            correct: false,
            misconception: 'The constant $+4$ differentiates to $0$.'
          },
          {
            id: 'b',
            latex: '3x',
            correct: false,
            misconception: 'Multiply $3$ by the exponent $2$: $3 \\cdot 2x = 6x$.'
          },
          {
            id: 'c',
            latex: '6x^2',
            correct: false,
            misconception: 'Subtract $1$ from the exponent of $x^2$ to get $6x$.'
          },
          {
            id: 'd',
            latex: '6x',
            correct: true
          }
        ],
        lockedLabel: 'Inner Deriv',
        lockedResultLatex: "u'(x) = \\textcolor{#34D399}{6x}",
        hint: 'Apply the power rule to $3x^2$ and drop the constant $+4$.'
      },
      {
        stepType: 'assemble',
        badge: 'Chain & Simplify',
        prompt: "Multiply outer derivative by inner derivative: $g'(u)\\cdot u'(x)$ and simplify.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{5(3x^2 + 4)^4} \\cdot \\textcolor{#34D399}{(6x)}",
        options: [
          {
            id: 'a',
            latex: '5(3x^2 + 4)^4',
            correct: false,
            misconception:
              'Forgot the Chain Rule link! You must multiply by the inner derivative $6x$.'
          },
          {
            id: 'b',
            latex: '11x(3x^2 + 4)^4',
            correct: false,
            misconception: 'Multiply the outside factors ($5 \\cdot 6x = 30x$), do not add them.'
          },
          {
            id: 'c',
            latex: '30x(3x^2 + 4)^4',
            correct: true
          },
          {
            id: 'd',
            latex: '(18x^2 + 24)^4',
            correct: false,
            misconception:
              'You cannot distribute $6x$ inside a bracket raised to the 4th power—multiply the outside coefficients $5 \\cdot 6x = 30x$.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{30x(3x^2 + 4)^4}",
        hint: 'Combine the outside factors $5 \\cdot 6x = 30x$ in front of $(3x^2 + 4)^4$.'
      }
    ]
  },

  {
    id: 'prob-10-chain-sin-poly',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Frequency-Modulated Chirp',
    mechatronicsContext:
      'Radar chirps and ultrasonic sweeps use non-linear phase arguments $\\phi(t) = t^3 - 2t$ inside $\\sin(\\phi(t))$, where $\\phi\'(t)$ is the instantaneous frequency.',
    expressionLatex: 'f(x) = \\sin(x^3 - 2x)',
    finalAnswerLatex: "f'(x) = (3x^2 - 2)\\cos(x^3 - 2x)",
    domain: [-1.8, 1.8],
    verifyFn: (x) => Math.sin(x ** 3 - 2 * x),
    verifyDerivFn: (x) => (3 * x * x - 2) * Math.cos(x ** 3 - 2 * x),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Peel Outer & Inner',
        prompt: 'Identify the outer trig shell and inner phase polynomial.',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{\\sin}\\!\\big(\\textcolor{#F59E0B}{x^3 - 2x}\\big)',
        options: [
          {
            id: 'a',
            latex: '\\text{Outer: } u^3 - 2u, \\quad \\text{Inner: } u = \\sin(x)',
            correct: false,
            misconception:
              'The polynomial sits INSIDE $\\sin(\\cdot)$, making $\\sin(u)$ the outer function.'
          },
          {
            id: 'b',
            latex: '\\text{Outer: } \\sin(x), \\quad \\text{Inner: } x^3 - 2x',
            correct: false,
            misconception:
              'This is a composition $\\sin(u)$, not a product $\\sin(x)\\cdot(x^3 - 2x)$.'
          },
          {
            id: 'c',
            latex: '\\text{Outer: } \\sin(u), \\quad \\text{Inner: } u = x^3 - 2x',
            correct: true
          },
          {
            id: 'd',
            latex: '\\text{Outer: } \\cos(u), \\quad \\text{Inner: } u = 3x^2 - 2',
            correct: false,
            misconception: 'First identify the undifferentiated functions before taking derivatives.'
          }
        ],
        lockedLabel: 'Outer & Inner',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{\\text{Outer: } \\sin(u)}, \\quad \\textcolor{#F59E0B}{\\text{Inner: } u = x^3 - 2x}',
        hint: 'The polynomial $x^3 - 2x$ is fed into $\\sin(\\cdot)$ as its argument.'
      },
      {
        stepType: 'diff_part',
        badge: 'Outer Derivative',
        prompt: 'Differentiate the outer $\\sin(u)$ while keeping the inner argument untouched.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\frac{d}{du}\\sin(u)}\\Big|_{u = \\textcolor{#F59E0B}{x^3 - 2x}}',
        options: [
          {
            id: 'a',
            latex: '\\cos(x^3 - 2x)',
            correct: true
          },
          {
            id: 'b',
            latex: '\\cos(3x^2 - 2)',
            correct: false,
            misconception:
              'Keep the original argument $(x^3 - 2x)$ inside $\\cos(\\cdot)$; the inner derivative multiplies on the OUTSIDE!'
          },
          {
            id: 'c',
            latex: '-\\cos(x^3 - 2x)',
            correct: false,
            misconception: '$\\frac{d}{du}\\sin(u) = +\\cos(u)$, with no minus sign.'
          },
          {
            id: 'd',
            latex: '\\sin(3x^2 - 2)',
            correct: false,
            misconception:
              'Differentiate the outer $\\sin$ to $\\cos$ and keep $(x^3 - 2x)$ intact inside.'
          }
        ],
        lockedLabel: 'Outer Deriv',
        lockedResultLatex:
          "g'(u) = \\textcolor{#34D399}{\\cos}(\\textcolor{#F59E0B}{x^3 - 2x})",
        hint: 'Derivative of $\\sin(u)$ is $\\cos(u)$—copy $u = x^3 - 2x$ unchanged inside.'
      },
      {
        stepType: 'diff_part',
        badge: 'Inner Derivative',
        prompt: 'Differentiate the inner phase polynomial $u = x^3 - 2x$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{x^3 - 2x}\\right)',
        options: [
          {
            id: 'a',
            latex: '3x^2 - 2x',
            correct: false,
            misconception: 'The derivative of $-2x$ is the constant $-2$, not $-2x$.'
          },
          {
            id: 'b',
            latex: '3x^2 - 2',
            correct: true
          },
          {
            id: 'c',
            latex: '3x^2',
            correct: false,
            misconception: 'Do not drop the derivative of $-2x$, which is $-2$.'
          },
          {
            id: 'd',
            latex: 'x^2 - 2',
            correct: false,
            misconception: 'Bring the exponent $3$ down in front of $x^2$.'
          }
        ],
        lockedLabel: 'Inner Deriv',
        lockedResultLatex: "u'(x) = \\textcolor{#34D399}{3x^2 - 2}",
        hint: 'Differentiate $x^3 \\to 3x^2$ and $-2x \\to -2$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Chain Rule',
        prompt: "Multiply $u'(x)$ by $g'(u)$ using parentheses around the polynomial factor.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{(3x^2 - 2)} \\cdot \\textcolor{#34D399}{\\cos(x^3 - 2x)}",
        options: [
          {
            id: 'a',
            latex: '\\cos(x^3 - 2x)',
            correct: false,
            misconception: 'Missing the Chain Rule factor $(3x^2 - 2)$!'
          },
          {
            id: 'b',
            latex: '3x^2 - 2\\cos(x^3 - 2x)',
            correct: false,
            misconception:
              'Missing parentheses! The ENTIRE inner derivative $(3x^2 - 2)$ multiplies $\\cos(x^3 - 2x)$.'
          },
          {
            id: 'c',
            latex: '-(3x^2 - 2)\\cos(x^3 - 2x)',
            correct: false,
            misconception: 'Since $\\frac{d}{du}\\sin(u) = +\\cos(u)$, there is no leading minus sign.'
          },
          {
            id: 'd',
            latex: '(3x^2 - 2)\\cos(x^3 - 2x)',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{(3x^2 - 2)\\cos(x^3 - 2x)}",
        hint: 'Place $(3x^2 - 2)$ in parentheses out front so it clearly multiplies the entire cosine term.'
      }
    ]
  },

  {
    id: 'prob-11-chain-gaussian',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Gaussian Bell Kernel',
    mechatronicsContext:
      'Kalman filters, Gaussian smoothing kernels, and laser beam profiles all follow $e^{-k x^2}$—notice the slope crosses zero cleanly at the peak.',
    expressionLatex: 'f(x) = e^{-2x^2}',
    finalAnswerLatex: "f'(x) = -4x\\,e^{-2x^2}",
    domain: [-2, 2],
    verifyFn: (x) => Math.exp(-2 * x * x),
    verifyDerivFn: (x) => -4 * x * Math.exp(-2 * x * x),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Peel Outer & Inner',
        prompt: 'Split $e^{-2x^2}$ into outer exponential $e^u$ and inner exponent $u(x)$.',
        highlightLatex: 'f(x) = \\textcolor{#22D3EE}{e}^{\\textcolor{#F59E0B}{-2x^2}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Outer: } e^u, \\quad \\text{Inner: } u = -2x^2',
            correct: true
          },
          {
            id: 'b',
            latex: '\\text{Outer: } u^{-2}, \\quad \\text{Inner: } u = e^{x^2}',
            correct: false,
            misconception:
              'The base is the constant $e$, so the outer function is the exponential $e^u$.'
          },
          {
            id: 'c',
            latex: '\\text{Outer: } e^{-2u}, \\quad \\text{Inner: } u = x',
            correct: false,
            misconception: 'Keep the entire exponent $-2x^2$ as the inner function $u(x)$.'
          },
          {
            id: 'd',
            latex: '\\text{Outer: } e^x, \\quad \\text{Inner: } -2x^2',
            correct: false,
            misconception: 'This is a composition $e^{u(x)}$, not a product $e^x \\cdot (-2x^2)$.'
          }
        ],
        lockedLabel: 'Outer & Inner',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{\\text{Outer: } e^u}, \\quad \\textcolor{#F59E0B}{\\text{Inner: } u = -2x^2}',
        hint: 'Everything in the superscript $-2x^2$ is the inner function $u(x)$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Outer Derivative',
        prompt: 'Differentiate the outer exponential $e^u$, keeping $u = -2x^2$ intact.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\frac{d}{du}(e^u)}\\Big|_{u = \\textcolor{#F59E0B}{-2x^2}}',
        options: [
          {
            id: 'a',
            latex: 'e^{-4x}',
            correct: false,
            misconception:
              'Never replace the exponent with its derivative! The exponential keeps its original exponent $e^{-2x^2}$.'
          },
          {
            id: 'b',
            latex: '-2x^2\\,e^{-2x^2 - 1}',
            correct: false,
            misconception:
              'Do NOT apply the power rule $n\\,x^{n-1}$ to an exponential $e^u$!'
          },
          {
            id: 'c',
            latex: 'e^{-2x^2}',
            correct: true
          },
          {
            id: 'd',
            latex: 'e^{2x^2}',
            correct: false,
            misconception: 'Preserve the minus sign in the original exponent $-2x^2$.'
          }
        ],
        lockedLabel: 'Outer Deriv',
        lockedResultLatex: "g'(u) = \\textcolor{#34D399}{e}^{\\textcolor{#F59E0B}{-2x^2}}",
        hint: 'Since $\\frac{d}{du}(e^u) = e^u$, the outer derivative copies $e^{-2x^2}$ unchanged.'
      },
      {
        stepType: 'diff_part',
        badge: 'Inner Derivative',
        prompt: 'Differentiate the inner exponent $u = -2x^2$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{-2x^2}\\right)',
        options: [
          {
            id: 'a',
            latex: '4x',
            correct: false,
            misconception: 'Watch the minus sign: $\\frac{d}{dx}(-2x^2) = -4x$.'
          },
          {
            id: 'b',
            latex: '-4x',
            correct: true
          },
          {
            id: 'c',
            latex: '-2x',
            correct: false,
            misconception: 'Multiply $-2$ by the exponent $2$ to get $-4x$.'
          },
          {
            id: 'd',
            latex: '-4x^2',
            correct: false,
            misconception: 'Lower the exponent by $1$: $x^2 \\to x^1$.'
          }
        ],
        lockedLabel: 'Inner Deriv',
        lockedResultLatex: "u'(x) = \\textcolor{#34D399}{-4x}",
        hint: 'Bring down the $2$ to multiply $-2$, yielding $-4x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Multiply Chain Links',
        prompt: 'Multiply the outer and inner derivatives together.',
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{e^{-2x^2}} \\cdot \\textcolor{#34D399}{(-4x)}",
        options: [
          {
            id: 'a',
            latex: 'e^{-2x^2}',
            correct: false,
            misconception: 'You must multiply by the inner derivative $-4x$!'
          },
          {
            id: 'b',
            latex: '4x\\,e^{-2x^2}',
            correct: false,
            misconception:
              'Check the sign: the bell curve rises for $x<0$ and falls for $x>0$, so the leading coefficient must be $-4x$.'
          },
          {
            id: 'c',
            latex: '-4x\\,e^{-4x}',
            correct: false,
            misconception:
              'Keep the original exponent $-2x^2$ on $e$; $-4x$ sits outside as a multiplier.'
          },
          {
            id: 'd',
            latex: '-4x\\,e^{-2x^2}',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{-4x\\,e^{-2x^2}}",
        hint: 'Place the $-4x$ factor cleanly in front of $e^{-2x^2}$.'
      }
    ]
  },

  {
    id: 'prob-12-combo-product-chain',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Product + Chain Boss Challenge',
    mechatronicsContext:
      'Compound robotic linkage Jacobians routinely combine Product Rule across factors with Chain Rule inside an actuator power term.',
    expressionLatex: 'f(x) = (2x + 1)^3 \\cos(x)',
    finalAnswerLatex: "f'(x) = (2x + 1)^2\\big(6\\cos(x) - (2x + 1)\\sin(x)\\big)",
    domain: [-1.5, 1.5],
    verifyFn: (x) => Math.pow(2 * x + 1, 3) * Math.cos(x),
    verifyDerivFn: (x) =>
      Math.pow(2 * x + 1, 2) * (6 * Math.cos(x) - (2 * x + 1) * Math.sin(x)),
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Master Strategy',
        prompt: 'Inspect the top-level structure of $(2x + 1)^3 \\cos(x)$. Which rules combine here?',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{(2x + 1)^3} \\cdot \\textcolor{#F59E0B}{\\cos(x)}',
        options: [
          {
            id: 'a',
            latex: '\\text{Chain Rule only}',
            correct: false,
            misconception:
              'The factors $(2x+1)^3$ and $\\cos(x)$ are multiplied together, so Product Rule governs the top level.'
          },
          {
            id: 'b',
            latex: '\\text{Product Rule outside, Chain Rule on } (2x + 1)^3',
            correct: true
          },
          {
            id: 'c',
            latex: '\\text{Product Rule only (no inner derivative needed)}',
            correct: false,
            misconception:
              'Because $2x + 1$ has slope $2 \\neq 1$, differentiating $(2x + 1)^3$ requires the Chain Rule.'
          },
          {
            id: 'd',
            latex: '\\text{Quotient Rule outside, Power Rule inside}',
            correct: false,
            misconception: 'There is no division here—it is a product of two factors.'
          }
        ],
        lockedLabel: 'Strategy',
        lockedResultLatex:
          '\\text{Product Rule on } \\textcolor{#22D3EE}{u}\\textcolor{#F59E0B}{v} \\text{ + Chain Rule on } \\textcolor{#22D3EE}{u = (2x+1)^3}',
        hint: 'Work outside-in: the outermost operation is multiplication, and the first factor is a nested cube.'
      },
      {
        stepType: 'diff_part',
        badge: 'Chain Rule on u',
        prompt: 'Use the Chain Rule to differentiate $u = (2x + 1)^3$.',
        highlightLatex:
          '\\frac{d}{dx}\\Big(\\textcolor{#22D3EE}{(}\\textcolor{#F59E0B}{2x + 1}\\textcolor{#22D3EE}{)^3}\\Big)',
        options: [
          {
            id: 'a',
            latex: '3(2x + 1)^2',
            correct: false,
            misconception:
              'Forgot the Chain Rule inner derivative! Multiply by $\\frac{d}{dx}(2x + 1) = 2$ to get $6(2x + 1)^2$.'
          },
          {
            id: 'b',
            latex: '3(2)^2 = 12',
            correct: false,
            misconception:
              'Keep $(2x + 1)$ intact inside the outer derivative, then multiply by $2$ outside.'
          },
          {
            id: 'c',
            latex: '6(2x + 1)^2',
            correct: true
          },
          {
            id: 'd',
            latex: '6(2x + 1)^3',
            correct: false,
            misconception: 'Remember to subtract $1$ from the exponent: $3 - 1 = 2$.'
          }
        ],
        lockedLabel: "u' (Chain)",
        lockedResultLatex: "\\textcolor{#34D399}{u' = 3(2x+1)^2 \\cdot 2 = 6(2x + 1)^2}",
        hint: 'Outer derivative gives $3(2x + 1)^2$, and inner derivative $\\frac{d}{dx}(2x + 1) = 2$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Differentiate v',
        prompt: 'Differentiate the second factor $v = \\cos(x)$.',
        highlightLatex: '\\frac{d}{dx}\\big(\\textcolor{#F59E0B}{\\cos(x)}\\big)',
        options: [
          {
            id: 'a',
            latex: "v' = -\\sin(x)",
            correct: true
          },
          {
            id: 'b',
            latex: "v' = \\sin(x)",
            correct: false,
            misconception: 'Classic sign error! $\\frac{d}{dx}\\cos(x) = -\\sin(x)$.'
          },
          {
            id: 'c',
            latex: "v' = -\\cos(x)",
            correct: false,
            misconception: 'Differentiating cosine changes it to negative sine: $-\\sin(x)$.'
          },
          {
            id: 'd',
            latex: "v' = \\sec^2(x)",
            correct: false,
            misconception: '$\\sec^2(x)$ is the derivative of $\\tan(x)$, not $\\cos(x)$.'
          }
        ],
        lockedLabel: "v'",
        lockedResultLatex: "\\textcolor{#34D399}{v' = -\\sin(x)}",
        hint: 'Cosine starts at its peak $1$ and bends downward, so its derivative is $-\\sin(x)$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Product',
        prompt: "Combine into $u'v + uv'$, watching the minus sign from $v' = -\\sin(x)$.",
        highlightLatex:
          '\\textcolor{#34D399}{6(2x+1)^2}\\textcolor{#F59E0B}{\\cos(x)} + \\textcolor{#22D3EE}{(2x+1)^3}\\big(\\textcolor{#34D399}{-\\sin(x)}\\big)',
        options: [
          {
            id: 'a',
            latex: '6(2x + 1)^2\\cos(x) + (2x + 1)^3\\sin(x)',
            correct: false,
            misconception:
              "Watch the sign from $v' = -\\sin(x)$! The second term must be subtracted."
          },
          {
            id: 'b',
            latex: '-6(2x + 1)^2\\sin(x)',
            correct: false,
            misconception:
              "That multiplies $u'\\cdot v'$ instead of forming the full Product Rule sum $u'v + uv'$."
          },
          {
            id: 'c',
            latex: '3(2x + 1)^2\\cos(x) - (2x + 1)^3\\sin(x)',
            correct: false,
            misconception:
              "Use the complete Chain Rule result $u' = 6(2x + 1)^2$, not $3(2x + 1)^2$."
          },
          {
            id: 'd',
            latex: '6(2x + 1)^2\\cos(x) - (2x + 1)^3\\sin(x)',
            correct: true
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = 6(2x + 1)^2\\cos(x) - (2x + 1)^3\\sin(x)",
        hint: 'Substitute each green derivative into $u\'v + uv\'$ and pull the minus out of $(-\\sin x)$.'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Common Power',
        prompt: 'Factor out the greatest common binomial power $(2x + 1)^2$ for a crisp final form.',
        highlightLatex:
          '\\textcolor{#22D3EE}{(2x + 1)^2}\\cdot 6\\cos(x) - \\textcolor{#22D3EE}{(2x + 1)^2}(2x + 1)\\sin(x)',
        options: [
          {
            id: 'a',
            latex: '(2x + 1)^2\\big(6\\cos(x) - \\sin(x)\\big)',
            correct: false,
            misconception:
              'Factoring $(2x+1)^2$ out of $(2x+1)^3$ still leaves one factor of $(2x+1)$ multiplying $\\sin(x)$.'
          },
          {
            id: 'b',
            latex: '(2x + 1)^2\\big(6\\cos(x) - (2x + 1)\\sin(x)\\big)',
            correct: true
          },
          {
            id: 'c',
            latex: '(2x + 1)^3\\big(6\\cos(x) - \\sin(x)\\big)',
            correct: false,
            misconception:
              'The first term only has $(2x+1)^2$, so you cannot factor out $(2x+1)^3$.'
          },
          {
            id: 'd',
            latex: '(2x + 1)^2\\big(6\\cos(x) + (2x + 1)\\sin(x)\\big)',
            correct: false,
            misconception: 'Preserve the minus sign in front of $(2x + 1)\\sin(x)$.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex:
          "f'(x) = \\textcolor{#34D399}{(2x + 1)^2\\big(6\\cos(x) - (2x + 1)\\sin(x)\\big)}",
        hint: 'Pull $(2x+1)^2$ out front: $6\\cos(x)$ remains from term 1, and $-(2x+1)\\sin(x)$ remains from term 2.'
      }
    ]
  },

  // =========================================================================
  // EXPANDED MASTERY PROBLEMS (PROBLEMS 13–18)
  // =========================================================================
  {
    id: 'prob-13-power-radical-reciprocal',
    tier: 'power',
    tierLabel: 'Power & Linearity',
    title: 'Radical & Reciprocal Power Mix',
    mechatronicsContext:
      'Hydraulic orifice flow scales as $\\sqrt{x}$, inverse sensor spacing scales as $x^{-1}$, and aerodynamic drag scales as $x^2$—converting every term to power form makes differentiation effortless.',
    expressionLatex: 'f(x) = 3\\sqrt{x} - \\frac{4}{x} + 2x^2',
    finalAnswerLatex: "f'(x) = \\frac{3}{2\\sqrt{x}} + \\frac{4}{x^2} + 4x",
    domain: [0.5, 4],
    verifyFn: (x) => 3 * Math.sqrt(x) - 4 / x + 2 * x * x,
    verifyDerivFn: (x) => 1.5 / Math.sqrt(x) + 4 / (x * x) + 4 * x,
    steps: [
      {
        stepType: 'decompose',
        badge: 'Rewrite as Powers',
        prompt: 'Rewrite $\\sqrt{x} = x^{1/2}$ and $\\frac{4}{x} = 4x^{-1}$ so every term is ready for the Power Rule.',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{3\\sqrt{x}} - \\textcolor{#F59E0B}{\\frac{4}{x}} + \\textcolor{#22D3EE}{2x^2}',
        options: [
          {
            id: 'a',
            latex: '3x^2 - 4x^{-1} + 2x^2',
            correct: false,
            misconception:
              'A square root is a fractional exponent $x^{1/2}$, not $x^2$.'
          },
          {
            id: 'b',
            latex: '3x^{-1/2} - 4x^{-1} + 2x^2',
            correct: false,
            misconception:
              '$\\sqrt{x}$ sits in the numerator, so its exponent is positive $+\\frac{1}{2}$, not $-\\frac{1}{2}$.'
          },
          {
            id: 'c',
            latex: '3x^{1/2} - 4x^{-1} + 2x^2',
            correct: true
          },
          {
            id: 'd',
            latex: '3x^{1/2} + 4x^{-1} + 2x^2',
            correct: false,
            misconception:
              'Rewriting $\\frac{1}{x}$ as $x^{-1}$ does not change the minus sign in front of $-4$ yet.'
          }
        ],
        lockedLabel: 'Power Form',
        lockedResultLatex:
          'f(x) = \\textcolor{#22D3EE}{3x^{1/2}} - \\textcolor{#F59E0B}{4x^{-1}} + \\textcolor{#22D3EE}{2x^2}',
        hint: 'Use $\\sqrt{x} = x^{1/2}$ and $\\frac{1}{x} = x^{-1}$ while keeping the coefficients $3$, $-4$, and $+2$ unchanged.'
      },
      {
        stepType: 'diff_part',
        badge: 'Radical Power Term',
        prompt: 'Apply the power rule to the radical term: $\\frac{d}{dx}\\big(3x^{1/2}\\big)$.',
        highlightLatex:
          '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{3x^{\\textcolor{#F59E0B}{1/2}}}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\frac{3}{2}x^{1/2}',
            correct: false,
            misconception:
              'Subtract $1$ from the exponent: $\\frac{1}{2} - 1 = -\\frac{1}{2}$.'
          },
          {
            id: 'b',
            latex: '\\frac{3}{2}x^{-1/2}',
            correct: true
          },
          {
            id: 'c',
            latex: '3x^{-1/2}',
            correct: false,
            misconception:
              'Remember to bring down the exponent $\\frac{1}{2}$ to multiply $3$: $3\\cdot\\frac{1}{2} = \\frac{3}{2}$.'
          },
          {
            id: 'd',
            latex: '\\frac{3}{2}x^{-3/2}',
            correct: false,
            misconception:
              'Careful with fraction subtraction: $\\frac{1}{2} - 1 = -\\frac{1}{2}$, not $-\\frac{3}{2}$.'
          }
        ],
        lockedLabel: 'Radical Deriv',
        lockedResultLatex:
          '\\frac{d}{dx}\\big(3x^{1/2}\\big) = \\textcolor{#34D399}{\\frac{3}{2}x^{-1/2}}',
        hint: 'Multiply $3 \\cdot \\frac{1}{2} = \\frac{3}{2}$ and reduce the exponent: $\\frac{1}{2} - 1 = -\\frac{1}{2}$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Reciprocal & Quadratic',
        prompt: 'Differentiate the remaining two terms: $\\frac{d}{dx}\\big(-4x^{-1} + 2x^2\\big)$.',
        highlightLatex:
          '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{-4x^{-1}} + \\textcolor{#22D3EE}{2x^2}\\right)',
        options: [
          {
            id: 'a',
            latex: '-4x^{-2} + 4x',
            correct: false,
            misconception:
              'Double negative! Multiplying $-4$ by the exponent $-1$ flips the sign to $+4x^{-2}$.'
          },
          {
            id: 'b',
            latex: '+4x^{0} + 4x',
            correct: false,
            misconception:
              'Subtracting $1$ from $-1$ gives $-1 - 1 = -2$, not $0$!'
          },
          {
            id: 'c',
            latex: '+4x^{-2} + 2x',
            correct: false,
            misconception:
              'For $2x^2$, bring down the exponent $2$ to multiply $2$: $2\\cdot 2x = 4x$.'
          },
          {
            id: 'd',
            latex: '+4x^{-2} + 4x',
            correct: true
          }
        ],
        lockedLabel: 'Remaining Terms',
        lockedResultLatex:
          '\\frac{d}{dx}\\big(-4x^{-1} + 2x^2\\big) = \\textcolor{#34D399}{+4x^{-2} + 4x}',
        hint: 'Compute $(-4)(-1)x^{-1-1} = +4x^{-2}$ and $2(2)x^{2-1} = 4x$.'
      },
      {
        stepType: 'simplify',
        badge: 'Clean Radical Form',
        prompt: 'Combine all three terms and rewrite negative/fractional exponents in clean radical and fraction form.',
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{\\frac{3}{2}x^{-1/2}} + \\textcolor{#34D399}{4x^{-2}} + \\textcolor{#34D399}{4x}",
        options: [
          {
            id: 'a',
            latex: '\\frac{3}{2\\sqrt{x}} + \\frac{4}{x^2} + 4x',
            correct: true
          },
          {
            id: 'b',
            latex: '\\frac{3\\sqrt{x}}{2} + \\frac{4}{x^2} + 4x',
            correct: false,
            misconception:
              'The exponent $-\\frac{1}{2}$ puts $\\sqrt{x}$ in the denominator: $x^{-1/2} = \\frac{1}{\\sqrt{x}}$.'
          },
          {
            id: 'c',
            latex: '\\frac{3}{2\\sqrt{x}} - \\frac{4}{x^2} + 4x',
            correct: false,
            misconception:
              'Moving $x^{-2}$ to the denominator keeps the $+$ sign from $+4x^{-2}$.'
          },
          {
            id: 'd',
            latex: '\\frac{3}{2\\sqrt{x}} + \\frac{1}{4x^2} + 4x',
            correct: false,
            misconception:
              'Only $x^{-2}$ moves to the denominator; the coefficient $4$ stays in the numerator.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex:
          "f'(x) = \\textcolor{#34D399}{\\frac{3}{2\\sqrt{x}} + \\frac{4}{x^2} + 4x}",
        hint: 'Replace $x^{-1/2}$ with $\\frac{1}{\\sqrt{x}}$ and $x^{-2}$ with $\\frac{1}{x^2}$.'
      }
    ]
  },

  {
    id: 'prob-14-arctan-exp-decay',
    tier: 'trig-exp',
    tierLabel: 'Trig & Exp',
    title: 'Phase Arctangent & Decay',
    mechatronicsContext:
      'First-order low-pass filter phase shifts follow $\\arctan(\\omega/\\omega_c)$, while transient RC capacitor voltages decay as $e^{-t}$.',
    expressionLatex: 'f(x) = 2\\arctan(x) + 3e^{-x}',
    finalAnswerLatex: "f'(x) = \\frac{2}{1 + x^2} - 3e^{-x}",
    domain: [-2.2, 2.2],
    verifyFn: (x) => 2 * Math.atan(x) + 3 * Math.exp(-x),
    verifyDerivFn: (x) => 2 / (1 + x * x) - 3 * Math.exp(-x),
    steps: [
      {
        stepType: 'diff_part',
        badge: 'Inverse Tangent',
        prompt: 'Differentiate the inverse tangent phase term: $\\frac{d}{dx}\\big(2\\arctan(x)\\big)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{2\\arctan(x)}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\frac{2}{\\sqrt{1 - x^2}}',
            correct: false,
            misconception:
              '$\\frac{1}{\\sqrt{1 - x^2}}$ is the derivative of $\\arcsin(x)$, not $\\arctan(x)$!'
          },
          {
            id: 'b',
            latex: '\\frac{2}{1 + x^2}',
            correct: true
          },
          {
            id: 'c',
            latex: '2\\sec^2(x)',
            correct: false,
            misconception:
              '$\\sec^2(x)$ is the derivative of $\\tan(x)$, whereas $\\frac{d}{dx}\\arctan(x) = \\frac{1}{1 + x^2}$.'
          },
          {
            id: 'd',
            latex: '\\frac{2}{1 - x^2}',
            correct: false,
            misconception:
              'Sign check in the denominator: $\\frac{d}{dx}\\arctan(x) = \\frac{1}{1 + x^2}$ (plus sign, smooth for all real $x$).'
          }
        ],
        lockedLabel: 'Arctan Deriv',
        lockedResultLatex:
          '\\frac{d}{dx}\\big(2\\arctan(x)\\big) = \\textcolor{#34D399}{\\frac{2}{1 + x^2}}',
        hint: 'Recall the standard inverse-trig identity $\\frac{d}{dx}\\arctan(x) = \\frac{1}{1 + x^2}$ and scale by $2$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Exponential Decay',
        prompt: 'Differentiate the exponential decay term: $\\frac{d}{dx}\\big(3e^{-x}\\big)$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{3e^{-x}}\\right)',
        options: [
          {
            id: 'a',
            latex: '3e^{-x}',
            correct: false,
            misconception:
              'Watch the inner derivative of $-x$! Multiply by $\\frac{d}{dx}(-x) = -1$ to get $-3e^{-x}$.'
          },
          {
            id: 'b',
            latex: '-3x\\,e^{-x-1}',
            correct: false,
            misconception:
              'Never use the power rule on an exponential—keep the exponent $-x$ intact and multiply by its derivative $-1$.'
          },
          {
            id: 'c',
            latex: '3e^{x}',
            correct: false,
            misconception:
              'The exponent $-x$ stays $-x$; only the sign out front flips from differentiating $-x$.'
          },
          {
            id: 'd',
            latex: '-3e^{-x}',
            correct: true
          }
        ],
        lockedLabel: 'Decay Deriv',
        lockedResultLatex:
          '\\frac{d}{dx}\\big(3e^{-x}\\big) = \\textcolor{#34D399}{-3e^{-x}}',
        hint: 'By the Chain Rule, $\\frac{d}{dx}(e^{kx}) = k\\,e^{kx}$; here $k = -1$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Result',
        prompt: "Combine both locked derivatives to complete $f'(x)$.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{\\frac{2}{1 + x^2}} + \\big(\\textcolor{#34D399}{-3e^{-x}}\\big)",
        options: [
          {
            id: 'a',
            latex: '\\frac{2}{1 + x^2} - 3e^{-x}',
            correct: true
          },
          {
            id: 'b',
            latex: '\\frac{2}{1 + x^2} + 3e^{-x}',
            correct: false,
            misconception:
              'Exponential decay $3e^{-x}$ slopes downward, so its derivative contributes $-3e^{-x}$.'
          },
          {
            id: 'c',
            latex: '\\frac{1}{2(1 + x^2)} - 3e^{-x}',
            correct: false,
            misconception:
              'Keep the factor $2$ in the numerator: $2\\cdot\\frac{1}{1+x^2} = \\frac{2}{1+x^2}$.'
          },
          {
            id: 'd',
            latex: '\\frac{2}{\\sqrt{1 - x^2}} - 3e^{-x}',
            correct: false,
            misconception:
              'Use the $\\arctan(x)$ derivative $\\frac{2}{1 + x^2}$, not the $\\arcsin(x)$ formula.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{2}{1 + x^2} - 3e^{-x}}",
        hint: 'Combine $\\frac{2}{1 + x^2}$ and $-3e^{-x}$ directly from the Step Ledger.'
      }
    ]
  },

  {
    id: 'prob-15-product-x2-lnx',
    tier: 'product',
    tierLabel: 'Product Rule',
    title: 'Quadratic-Logarithmic Profile',
    mechatronicsContext:
      'Cylindrical heat-conduction solutions and information-entropy scaling combine algebraic powers $x^2$ with logarithmic terms $\\ln(x)$.',
    expressionLatex: 'f(x) = x^2 \\ln(x)',
    finalAnswerLatex: "f'(x) = x\\big(2\\ln(x) + 1\\big)",
    domain: [0.35, 3.5],
    verifyFn: (x) => x * x * Math.log(x),
    verifyDerivFn: (x) => x * (2 * Math.log(x) + 1),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Decompose u & v',
        prompt: 'Split the product $x^2\\ln(x)$ into factors $u$ and $v$ for the Product Rule.',
        highlightLatex: 'f(x) = \\textcolor{#22D3EE}{x^2} \\cdot \\textcolor{#F59E0B}{\\ln(x)}',
        options: [
          {
            id: 'a',
            latex: 'u = 2x, \\quad v = \\frac{1}{x}',
            correct: false,
            misconception:
              "Those are already the derivatives $u'$ and $v'$—first lock in the original factors $u$ and $v$."
          },
          {
            id: 'b',
            latex: 'u = \\ln(x^2), \\quad v = x',
            correct: false,
            misconception:
              '$x^2$ multiplies $\\ln(x)$ on the outside; it is not inside the logarithm.'
          },
          {
            id: 'c',
            latex: 'u = x^2, \\quad v = \\ln(x)',
            correct: true
          },
          {
            id: 'd',
            latex: 'u = x, \\quad v = x\\ln(x)',
            correct: false,
            misconception:
              'Keep the algebraic power $x^2$ together as $u$ so each factor differentiates in a single clean step.'
          }
        ],
        lockedLabel: 'Factors',
        lockedResultLatex: '\\textcolor{#22D3EE}{u = x^2}, \\quad \\textcolor{#F59E0B}{v = \\ln(x)}',
        hint: 'Match Cyan $u = x^2$ and Amber $v = \\ln(x)$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "Compute the individual derivatives $u'$ and $v'$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = x^2} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = \\ln(x)} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = 2x, \\quad v' = \\frac{1}{x}",
            correct: true
          },
          {
            id: 'b',
            latex: "u' = 2x, \\quad v' = e^x",
            correct: false,
            misconception:
              '$e^x$ is the inverse of $\\ln(x)$, not its derivative—recall $\\frac{d}{dx}\\ln(x) = \\frac{1}{x}$.'
          },
          {
            id: 'c',
            latex: "u' = x, \\quad v' = \\frac{1}{x}",
            correct: false,
            misconception:
              'Bring down the exponent $2$ from $x^2$: $u\' = 2x$.'
          },
          {
            id: 'd',
            latex: "u' = 2x, \\quad v' = -\\frac{1}{x^2}",
            correct: false,
            misconception:
              '$-\\frac{1}{x^2}$ is the second derivative of $\\ln(x)$; the first derivative is $\\frac{1}{x}$.'
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex:
          "\\textcolor{#34D399}{u' = 2x}, \\quad \\textcolor{#34D399}{v' = \\frac{1}{x}}",
        hint: 'Apply the power rule to $x^2$ and use $\\frac{d}{dx}\\ln(x) = \\frac{1}{x}$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble & Cancel',
        prompt: "Substitute into $u'v + uv'$ and simplify $x^2 \\cdot \\frac{1}{x}$.",
        highlightLatex:
          "f'(x) = (\\textcolor{#34D399}{2x})(\\textcolor{#F59E0B}{\\ln x}) + (\\textcolor{#22D3EE}{x^2})\\!\\left(\\textcolor{#34D399}{\\frac{1}{x}}\\right)",
        options: [
          {
            id: 'a',
            latex: '2x\\cdot\\frac{1}{x} = 2',
            correct: false,
            misconception:
              "Classic trap! That computes $u'\\cdot v'$ instead of the Product Rule sum $u'v + uv'$."
          },
          {
            id: 'b',
            latex: '2x\\ln(x) - x',
            correct: false,
            misconception:
              'The Product Rule adds the two cross-terms with a $+$ sign.'
          },
          {
            id: 'c',
            latex: '2x\\ln(x) + 1',
            correct: false,
            misconception:
              'Check the cancellation: $x^2 \\cdot \\frac{1}{x} = x$, not $1$.'
          },
          {
            id: 'd',
            latex: '2x\\ln(x) + x',
            correct: true
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = 2x\\ln(x) + x",
        hint: 'Cancel one power of $x$ in $x^2 \\cdot \\frac{1}{x} = x$, giving $2x\\ln(x) + x$.'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Common x',
        prompt: 'Factor out the common factor $x$ for the cleanest final form.',
        highlightLatex:
          '\\textcolor{#22D3EE}{x}\\cdot 2\\ln(x) + \\textcolor{#22D3EE}{x}\\cdot 1',
        options: [
          {
            id: 'a',
            latex: 'x\\big(2\\ln(x)\\big)',
            correct: false,
            misconception:
              'When factoring $x$ out of $+x$, a $+1$ placeholder stays inside the parentheses!'
          },
          {
            id: 'b',
            latex: 'x\\big(2\\ln(x) + 1\\big)',
            correct: true
          },
          {
            id: 'c',
            latex: '2x\\big(\\ln(x) + 1\\big)',
            correct: false,
            misconception:
              'The second term $+x$ has no factor of $2$; factoring out $2x$ would leave $+\\frac{1}{2}$, not $+1$.'
          },
          {
            id: 'd',
            latex: 'x\\big(2\\ln(x) + x\\big)',
            correct: false,
            misconception:
              'Once $x$ is factored out of $+x$, only $+1$ remains inside.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{x\\big(2\\ln(x) + 1\\big)}",
        hint: 'Pull $x$ out front: $2\\ln(x)$ stays from the first term and $+1$ stays from $+x$.'
      }
    ]
  },

  {
    id: 'prob-16-quotient-exp-quad',
    tier: 'quotient',
    tierLabel: 'Quotient Rule',
    title: 'Exponential-Quadratic Transfer',
    mechatronicsContext:
      'Frequency-weighted actuator transfer ratios combine exponential forcing $e^x$ over a quadratic pole denominator $x^2 + 1$.',
    expressionLatex: 'f(x) = \\frac{e^x}{x^2 + 1}',
    finalAnswerLatex: "f'(x) = \\frac{e^x(x - 1)^2}{(x^2 + 1)^2}",
    domain: [-1.5, 2.2],
    verifyFn: (x) => Math.exp(x) / (x * x + 1),
    verifyDerivFn: (x) => (Math.exp(x) * (x - 1) ** 2) / (x * x + 1) ** 2,
    steps: [
      {
        stepType: 'diff_part',
        badge: 'Differentiate Parts',
        prompt: "With $u = e^x$ and $v = x^2 + 1$, compute $u'$ and $v'$.",
        highlightLatex:
          "\\textcolor{#22D3EE}{u = e^x} \\Rightarrow u'=\\,?, \\quad \\textcolor{#F59E0B}{v = x^2 + 1} \\Rightarrow v'=\\,?",
        options: [
          {
            id: 'a',
            latex: "u' = x\\,e^{x-1}, \\quad v' = 2x",
            correct: false,
            misconception:
              '$e^x$ is its own derivative—never apply the power rule to an exponential.'
          },
          {
            id: 'b',
            latex: "u' = e^x, \\quad v' = 2x",
            correct: true
          },
          {
            id: 'c',
            latex: "u' = e^x, \\quad v' = 2x + 1",
            correct: false,
            misconception:
              'The constant $+1$ differentiates to $0$, leaving $v\' = 2x$.'
          },
          {
            id: 'd',
            latex: "u' = 1, \\quad v' = 2x",
            correct: false,
            misconception:
              '$\\frac{d}{dx}(e^x) = e^x$, not $1$.'
          }
        ],
        lockedLabel: 'Sub-Derivatives',
        lockedResultLatex: "\\textcolor{#34D399}{u' = e^x}, \\quad \\textcolor{#34D399}{v' = 2x}",
        hint: 'Recall $\\frac{d}{dx}(e^x) = e^x$ and $\\frac{d}{dx}(x^2 + 1) = 2x$.'
      },
      {
        stepType: 'assemble',
        badge: 'Apply Quotient Rule',
        prompt: "Substitute $u, v, u', v'$ into $\\frac{u'v - uv'}{v^2}$.",
        highlightLatex:
          '\\frac{(\\textcolor{#34D399}{e^x})(\\textcolor{#F59E0B}{x^2 + 1}) - (\\textcolor{#22D3EE}{e^x})(\\textcolor{#34D399}{2x})}{(\\textcolor{#F59E0B}{x^2 + 1})^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{e^x(x^2 + 1) + e^x(2x)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              'The Quotient Rule subtracts $uv\'$ in the numerator, not adds.'
          },
          {
            id: 'b',
            latex: '\\frac{e^x(2x) - e^x(x^2 + 1)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              'Reversed order! Always start with $u\'v = e^x(x^2 + 1)$ minus $uv\' = e^x(2x)$.'
          },
          {
            id: 'c',
            latex: '\\frac{e^x(x^2 + 1) - e^x(2x)}{(x^2 + 1)^2}',
            correct: true
          },
          {
            id: 'd',
            latex: '\\frac{e^x(x^2 + 1) - e^x(2x)}{x^2 + 1}',
            correct: false,
            misconception:
              'Do not forget to square the denominator: $(x^2 + 1)^2$.'
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = \\frac{e^x(x^2 + 1) - e^x(2x)}{(x^2 + 1)^2}",
        hint: 'Plug directly into "low d-high minus high d-low, over low squared."'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Out e^x',
        prompt: 'Factor the common $e^x$ out of the numerator and sort the quadratic in descending powers.',
        highlightLatex:
          '\\frac{\\textcolor{#22D3EE}{e^x}\\big((x^2 + 1) - 2x\\big)}{(x^2 + 1)^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{e^x(x^2 - 2x + 1)}{(x^2 + 1)^2}',
            correct: true
          },
          {
            id: 'b',
            latex: '\\frac{e^x(x^2 + 2x + 1)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              'Preserve the minus sign from $-e^x(2x)$: the middle term is $-2x$.'
          },
          {
            id: 'c',
            latex: '\\frac{e^{2x}(x^2 - 2x + 1)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              'Factoring $e^x$ out of a difference leaves a single $e^x$, not $e^{2x}$.'
          },
          {
            id: 'd',
            latex: '\\frac{e^x(x^2 - 2x)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              'Do not drop the $+1$ from $(x^2 + 1)$!'
          }
        ],
        lockedLabel: 'Factored e^x',
        lockedResultLatex: "f'(x) = \\frac{e^x(x^2 - 2x + 1)}{(x^2 + 1)^2}",
        hint: 'Pull out one shared $e^x$ and reorder $(x^2 + 1) - 2x = x^2 - 2x + 1$.'
      },
      {
        stepType: 'simplify',
        badge: 'Perfect Square Form',
        prompt: 'Notice that $x^2 - 2x + 1$ is a perfect square—write the final factored derivative.',
        highlightLatex:
          '\\frac{e^x\\textcolor{#34D399}{(x^2 - 2x + 1)}}{(x^2 + 1)^2}',
        options: [
          {
            id: 'a',
            latex: '\\frac{e^x(x + 1)^2}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              '$(x + 1)^2 = x^2 + 2x + 1$; the minus sign on $-2x$ requires $(x - 1)^2$.'
          },
          {
            id: 'b',
            latex: '\\frac{e^x(x - 1)}{(x^2 + 1)^2}',
            correct: false,
            misconception:
              '$x^2 - 2x + 1$ is quadratic, so it factors as $(x - 1)^2$ (squared!).'
          },
          {
            id: 'c',
            latex: '\\frac{e^x(x - 1)^2}{x^4 + 1}',
            correct: false,
            misconception:
              '$(x^2 + 1)^2 \\neq x^4 + 1$—keep the denominator cleanly factored as $(x^2 + 1)^2$.'
          },
          {
            id: 'd',
            latex: '\\frac{e^x(x - 1)^2}{(x^2 + 1)^2}',
            correct: true
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{e^x(x - 1)^2}{(x^2 + 1)^2}}",
        hint: 'Factor $x^2 - 2x + 1 = (x - 1)^2$—this also reveals immediately that $f\'(x) \\ge 0$ everywhere!'
      }
    ]
  },

  {
    id: 'prob-17-chain-log-quadratic',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Log-Barrier Gradient',
    mechatronicsContext:
      'Interior-point trajectory barriers and cross-entropy loss gradients take the log-chain form $\\frac{d}{dx}\\ln(u(x)) = \\frac{u\'(x)}{u(x)}$.',
    expressionLatex: 'f(x) = \\ln(x^2 + 4x + 5)',
    finalAnswerLatex: "f'(x) = \\frac{2x + 4}{x^2 + 4x + 5}",
    domain: [-3.5, 1.5],
    verifyFn: (x) => Math.log(x * x + 4 * x + 5),
    verifyDerivFn: (x) => (2 * x + 4) / (x * x + 4 * x + 5),
    steps: [
      {
        stepType: 'decompose',
        badge: 'Peel Outer & Inner',
        prompt: 'Split $\\ln(x^2 + 4x + 5)$ into its outer logarithm $g(u)$ and inner quadratic $u(x)$.',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{\\ln}\\!\\big(\\textcolor{#F59E0B}{x^2 + 4x + 5}\\big)',
        options: [
          {
            id: 'a',
            latex: '\\text{Outer: } u^2 + 4u + 5, \\quad \\text{Inner: } u = \\ln(x)',
            correct: false,
            misconception:
              'Inverted! The quadratic sits INSIDE $\\ln(\\cdot)$, so $\\ln(u)$ is the outer function.'
          },
          {
            id: 'b',
            latex: '\\text{Outer: } \\ln(x), \\quad \\text{Inner: } x^2 + 4x + 5',
            correct: false,
            misconception:
              'This is a nested composition $\\ln(u)$, not a product $\\ln(x)\\cdot(x^2 + 4x + 5)$.'
          },
          {
            id: 'c',
            latex: '\\text{Outer: } \\frac{1}{u}, \\quad \\text{Inner: } u = 2x + 4',
            correct: false,
            misconception:
              'First identify the original undifferentiated outer and inner layers.'
          },
          {
            id: 'd',
            latex: '\\text{Outer: } \\ln(u), \\quad \\text{Inner: } u = x^2 + 4x + 5',
            correct: true
          }
        ],
        lockedLabel: 'Outer & Inner',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{\\text{Outer: } \\ln(u)}, \\quad \\textcolor{#F59E0B}{\\text{Inner: } u = x^2 + 4x + 5}',
        hint: 'Ask which function wraps the entire quadratic expression—the natural log $\\ln(u)$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Outer Log Deriv',
        prompt: 'Differentiate the outer $\\ln(u)$, keeping the inner quadratic $u = x^2 + 4x + 5$ untouched.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\frac{d}{du}\\ln(u)}\\Big|_{u = \\textcolor{#F59E0B}{x^2 + 4x + 5}}',
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{2x + 4}',
            correct: false,
            misconception:
              'Never differentiate the inside inside the denominator! Keep the original $u = x^2 + 4x + 5$ in $\\frac{1}{u}$.'
          },
          {
            id: 'b',
            latex: '\\frac{1}{x^2 + 4x + 5}',
            correct: true
          },
          {
            id: 'c',
            latex: '\\ln(2x + 4)',
            correct: false,
            misconception:
              'Differentiating $\\ln(u)$ turns it into the reciprocal $\\frac{1}{u}$, not another logarithm.'
          },
          {
            id: 'd',
            latex: 'e^{x^2 + 4x + 5}',
            correct: false,
            misconception:
              '$e^u$ is the inverse of $\\ln(u)$, whereas $\\frac{d}{du}\\ln(u) = \\frac{1}{u}$.'
          }
        ],
        lockedLabel: 'Outer Deriv',
        lockedResultLatex:
          "g'(u) = \\textcolor{#34D399}{\\frac{1}{\\textcolor{#F59E0B}{x^2 + 4x + 5}}}",
        hint: 'Apply $\\frac{d}{du}\\ln(u) = \\frac{1}{u}$ and substitute $u = x^2 + 4x + 5$ verbatim.'
      },
      {
        stepType: 'diff_part',
        badge: 'Inner Derivative',
        prompt: 'Now differentiate the inner quadratic $u = x^2 + 4x + 5$.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#F59E0B}{x^2 + 4x + 5}\\right)',
        options: [
          {
            id: 'a',
            latex: '2x + 4',
            correct: true
          },
          {
            id: 'b',
            latex: '2x + 4 + 5',
            correct: false,
            misconception:
              'The standalone constant $+5$ differentiates to $0$.'
          },
          {
            id: 'c',
            latex: '2x + 4x',
            correct: false,
            misconception:
              'The derivative of the linear term $4x$ is the constant $4$, not $4x$.'
          },
          {
            id: 'd',
            latex: 'x + 4',
            correct: false,
            misconception:
              'Bring down the exponent $2$ on $x^2$: $\\frac{d}{dx}(x^2) = 2x$.'
          }
        ],
        lockedLabel: 'Inner Deriv',
        lockedResultLatex: "u'(x) = \\textcolor{#34D399}{2x + 4}",
        hint: 'Differentiate term-by-term: $x^2 \\to 2x$, $4x \\to 4$, and $5 \\to 0$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Log-Chain',
        prompt: "Multiply $g'(u)\\cdot u'(x)$ to form the log-derivative ratio $\\frac{u'(x)}{u(x)}$.",
        highlightLatex:
          "f'(x) = \\textcolor{#34D399}{\\frac{1}{x^2 + 4x + 5}} \\cdot \\textcolor{#34D399}{(2x + 4)}",
        options: [
          {
            id: 'a',
            latex: '\\frac{1}{x^2 + 4x + 5}',
            correct: false,
            misconception:
              'Missing the Chain Rule factor! Multiply by the inner derivative $2x + 4$ in the numerator.'
          },
          {
            id: 'b',
            latex: '\\frac{2x + 4}{(x^2 + 4x + 5)^2}',
            correct: false,
            misconception:
              'Do NOT square the denominator—that belongs to the Quotient Rule, whereas $\\frac{d}{dx}\\ln(u) = \\frac{u\'}{u}$.'
          },
          {
            id: 'c',
            latex: '\\frac{2x + 4}{x^2 + 4x + 5}',
            correct: true
          },
          {
            id: 'd',
            latex: '\\frac{x^2 + 4x + 5}{2x + 4}',
            correct: false,
            misconception:
              'Inverted fraction! The derivative $u\'(x)$ goes in the numerator and $u(x)$ stays in the denominator.'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex: "f'(x) = \\textcolor{#34D399}{\\frac{2x + 4}{x^2 + 4x + 5}}",
        hint: 'Place the inner derivative $2x + 4$ in the numerator over the original quadratic $x^2 + 4x + 5$.'
      }
    ]
  },

  {
    id: 'prob-18-combo-damped-servo',
    tier: 'chain',
    tierLabel: 'Chain & Combo',
    title: 'Damped Servo Velocity',
    mechatronicsContext:
      'Underdamped PID servo settling follows $x(t) = e^{-0.5t}\\sin(2t)$—combining Product Rule with Chain Rule yields the exact actuator velocity profile.',
    expressionLatex: 'f(x) = e^{-0.5x}\\sin(2x)',
    finalAnswerLatex: "f'(x) = e^{-0.5x}\\big(2\\cos(2x) - 0.5\\sin(2x)\\big)",
    domain: [0, 5],
    verifyFn: (x) => Math.exp(-0.5 * x) * Math.sin(2 * x),
    verifyDerivFn: (x) => Math.exp(-0.5 * x) * (2 * Math.cos(2 * x) - 0.5 * Math.sin(2 * x)),
    steps: [
      {
        stepType: 'identify_rule',
        badge: 'Master Strategy',
        prompt: 'Inspect $e^{-0.5x}\\sin(2x)$. Which combination of differentiation rules applies?',
        highlightLatex:
          'f(x) = \\textcolor{#22D3EE}{e^{-0.5x}} \\cdot \\textcolor{#F59E0B}{\\sin(2x)}',
        options: [
          {
            id: 'a',
            latex: '\\text{Product Rule only (no inner derivatives needed)}',
            correct: false,
            misconception:
              'Both $-0.5x$ and $2x$ have non-unit slopes, so each factor requires the Chain Rule!'
          },
          {
            id: 'b',
            latex: '\\text{Chain Rule only}',
            correct: false,
            misconception:
              'The decay envelope $e^{-0.5x}$ and oscillation $\\sin(2x)$ are multiplied together, so Product Rule governs the top level.'
          },
          {
            id: 'c',
            latex: '\\text{Product Rule outside, Chain Rule on both } e^{-0.5x} \\text{ and } \\sin(2x)',
            correct: true
          },
          {
            id: 'd',
            latex: '\\text{Quotient Rule outside, Power Rule inside}',
            correct: false,
            misconception:
              'This is a product of an exponential and a trig function, not a quotient.'
          }
        ],
        lockedLabel: 'Strategy',
        lockedResultLatex:
          '\\text{Product Rule on } \\textcolor{#22D3EE}{u}\\textcolor{#F59E0B}{v} \\text{ + Chain Rule on both factors}',
        hint: 'Outside operation is multiplication ($u\\cdot v$), and each factor has a linear scaling inside ($-0.5x$ and $2x$).'
      },
      {
        stepType: 'diff_part',
        badge: 'Chain Rule on u',
        prompt: 'Differentiate the exponential envelope $u = e^{-0.5x}$ using the Chain Rule.',
        highlightLatex: '\\frac{d}{dx}\\left(\\textcolor{#22D3EE}{e}^{\\textcolor{#F59E0B}{-0.5x}}\\right)',
        options: [
          {
            id: 'a',
            latex: "u' = -0.5e^{-0.5x}",
            correct: true
          },
          {
            id: 'b',
            latex: "u' = e^{-0.5x}",
            correct: false,
            misconception:
              'Forgot the Chain Rule inner derivative! Multiply by $\\frac{d}{dx}(-0.5x) = -0.5$.'
          },
          {
            id: 'c',
            latex: "u' = 0.5e^{-0.5x}",
            correct: false,
            misconception:
              'Watch the minus sign: the decay exponent $-0.5x$ differentiates to $-0.5$, not $+0.5$.'
          },
          {
            id: 'd',
            latex: "u' = -0.5e^{-1.5x}",
            correct: false,
            misconception:
              'Never subtract $1$ from the exponent of an exponential—keep $e^{-0.5x}$ intact.'
          }
        ],
        lockedLabel: "u' (Chain)",
        lockedResultLatex: "\\textcolor{#34D399}{u' = -0.5e^{-0.5x}}",
        hint: 'Keep $e^{-0.5x}$ unchanged and multiply out front by $\\frac{d}{dx}(-0.5x) = -0.5$.'
      },
      {
        stepType: 'diff_part',
        badge: 'Chain Rule on v',
        prompt: 'Differentiate the harmonic carrier $v = \\sin(2x)$ using the Chain Rule.',
        highlightLatex: '\\frac{d}{dx}\\Big(\\textcolor{#22D3EE}{\\sin}(\\textcolor{#F59E0B}{2x})\\Big)',
        options: [
          {
            id: 'a',
            latex: "v' = \\cos(2x)",
            correct: false,
            misconception:
              'Missing the Chain Rule frequency factor! Multiply by $\\frac{d}{dx}(2x) = 2$.'
          },
          {
            id: 'b',
            latex: "v' = -2\\cos(2x)",
            correct: false,
            misconception:
              'Sign check: $\\frac{d}{du}\\sin(u) = +\\cos(u)$, with no minus sign.'
          },
          {
            id: 'c',
            latex: "v' = 2\\cos(x)",
            correct: false,
            misconception:
              'Keep the original argument $(2x)$ inside cosine: $2\\cos(2x)$.'
          },
          {
            id: 'd',
            latex: "v' = 2\\cos(2x)",
            correct: true
          }
        ],
        lockedLabel: "v' (Chain)",
        lockedResultLatex: "\\textcolor{#34D399}{v' = 2\\cos(2x)}",
        hint: 'Outer $\\sin(u) \\to \\cos(u)$ with $u = 2x$, times inner derivative $\\frac{d}{dx}(2x) = 2$.'
      },
      {
        stepType: 'assemble',
        badge: 'Assemble Product',
        prompt: "Combine $u, v, u', v'$ into $f'(x) = u'v + uv'$.",
        highlightLatex:
          '(\\textcolor{#34D399}{-0.5e^{-0.5x}})(\\textcolor{#F59E0B}{\\sin(2x)}) + (\\textcolor{#22D3EE}{e^{-0.5x}})(\\textcolor{#34D399}{2\\cos(2x)})',
        options: [
          {
            id: 'a',
            latex: '-e^{-0.5x}\\cos(2x)',
            correct: false,
            misconception:
              "Classic trap! That multiplies $u'\\cdot v'$ instead of forming the Product Rule sum $u'v + uv'$."
          },
          {
            id: 'b',
            latex: '-0.5e^{-0.5x}\\sin(2x) + 2e^{-0.5x}\\cos(2x)',
            correct: true
          },
          {
            id: 'c',
            latex: '-0.5e^{-0.5x}\\sin(2x) - 2e^{-0.5x}\\cos(2x)',
            correct: false,
            misconception:
              'The Product Rule adds $+uv\'$; since $v\' = +2\\cos(2x)$, the cosine term is positive.'
          },
          {
            id: 'd',
            latex: '0.5e^{-0.5x}\\sin(2x) + 2e^{-0.5x}\\cos(2x)',
            correct: false,
            misconception:
              'Keep the negative sign from $u\' = -0.5e^{-0.5x}$ on the sine term.'
          }
        ],
        lockedLabel: 'Assembled',
        lockedResultLatex: "f'(x) = 2e^{-0.5x}\\cos(2x) - 0.5e^{-0.5x}\\sin(2x)",
        hint: 'Pair $u\'v = -0.5e^{-0.5x}\\sin(2x)$ with $+uv\' = +2e^{-0.5x}\\cos(2x)$.'
      },
      {
        stepType: 'simplify',
        badge: 'Factor Decay Envelope',
        prompt: 'Factor out the shared decay envelope $e^{-0.5x}$ for the clean engineering velocity form.',
        highlightLatex:
          '\\textcolor{#22D3EE}{e^{-0.5x}}\\cdot 2\\cos(2x) - \\textcolor{#22D3EE}{e^{-0.5x}}\\cdot 0.5\\sin(2x)',
        options: [
          {
            id: 'a',
            latex: 'e^{-0.5x}\\big(2\\cos(2x) + 0.5\\sin(2x)\\big)',
            correct: false,
            misconception:
              'Check the damping sign: the $-0.5\\sin(2x)$ term stays negative because the envelope decays.'
          },
          {
            id: 'b',
            latex: 'e^{-0.5x}\\big(\\cos(2x) - 0.5\\sin(2x)\\big)',
            correct: false,
            misconception:
              'Do not drop the frequency factor $2$ in front of $\\cos(2x)$!'
          },
          {
            id: 'c',
            latex: 'e^{-0.5x}\\big(2\\cos(2x) - 0.5\\sin(2x)\\big)',
            correct: true
          },
          {
            id: 'd',
            latex: 'e^{-x}\\big(2\\cos(2x) - 0.5\\sin(2x)\\big)',
            correct: false,
            misconception:
              'Factoring $e^{-0.5x}$ out of a sum keeps the same exponent $-0.5x$ (do not double it to $-x$).'
          }
        ],
        lockedLabel: 'Final Result',
        lockedResultLatex:
          "f'(x) = \\textcolor{#34D399}{e^{-0.5x}\\big(2\\cos(2x) - 0.5\\sin(2x)\\big)}",
        hint: 'Pull $e^{-0.5x}$ out front and write the positive $2\\cos(2x)$ term first, followed by $-0.5\\sin(2x)$.'
      }
    ]
  }
];
