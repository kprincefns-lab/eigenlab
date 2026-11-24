/**
 * EIGENLAB — Linear Algebra, Eigenvalues & Transforms Paperless Step-by-Step Problem Bank
 * 14 multi-step engineering linear algebra problems spanning 5 progressive mastery tiers:
 * Vectors & Geometry, Matrices & Linear Systems, Eigenvalues & Diagonalization,
 * Orthogonality & Least Squares, and SVD & Symmetric Positive-Definite Matrices.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Primary vector / matrix A / pivot row / first eigen-direction / column space
 *  - Amber  (#F59E0B): Secondary vector / scalar λ / right-hand side b / off-diagonal / residual
 *  - Emerald(#34D399): Solved step result / projection / inverse / eigenvalues / orthonormal basis / singular values
 */

export const LINALG_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'vectors', label: 'Vectors' },
  { id: 'matrices', label: 'Matrices' },
  { id: 'eigen', label: 'Eigenvalues' },
  { id: 'orthogonality', label: 'Orthogonal' },
  { id: 'svd-decomp', label: 'SVD & SPD' },
];

export const LINALG_PROBLEMS = [
  // =========================================================================
  // TIER 1: VECTORS & GEOMETRY (3 problems)
  // =========================================================================
  {
    id: 'la1-dot-angle',
    tier: 'vectors',
    tierLabel: 'Vectors',
    title: 'Dot Product & Angle Between Vectors',
    mechatronicsContext:
      'In autonomous SLAM, computing the dot product between a LiDAR ray direction $\\mathbf{u}$ and a wall surface normal $\\mathbf{v}$ yields the exact incidence angle $\\theta$ used to reject grazing multipath returns.',
    expressionLatex:
      '\\mathbf{u} = \\begin{bmatrix} 1 \\\\ \\sqrt{3} \\end{bmatrix}, \\quad \\mathbf{v} = \\begin{bmatrix} \\sqrt{3} \\\\ 1 \\end{bmatrix}, \\quad \\text{find } \\theta',
    finalAnswerLatex:
      '\\theta = 30^\\circ = \\frac{\\pi}{6}\\text{ rad} \\qquad \\left(\\mathbf{u}\\cdot\\mathbf{v} = 2\\sqrt{3}\\right)',
    verifyPlot: {
      kind: 'vectors',
      u: [1, Math.sqrt(3)],
      v: [Math.sqrt(3), 1],
      uLabel: 'u',
      vLabel: 'v',
      angleDeg: 30,
      dotProduct: 2 * Math.sqrt(3),
      metrics: [
        { label: 'Dot u · v', value: '3.4641 (2√3)' },
        { label: '‖u‖, ‖v‖', value: '2.000, 2.000' },
        { label: 'cos θ', value: '0.8660 (√3/2)' },
        { label: 'Angle θ', value: '30.00° (π/6) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'dot_product',
        badge: 'Compute Dot Product',
        prompt:
          'Compute the inner product $\\mathbf{u}\\cdot\\mathbf{v} = u_1 v_1 + u_2 v_2$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\mathbf{u}}\\cdot\\textcolor{#F59E0B}{\\mathbf{v}} = (\\textcolor{#22D3EE}{1})(\\textcolor{#F59E0B}{\\sqrt{3}}) + (\\textcolor{#22D3EE}{\\sqrt{3}})(\\textcolor{#F59E0B}{1})',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{u}\\cdot\\mathbf{v} = \\sqrt{3}',
            correct: false,
            misconception:
              'You computed only one pair! Both terms evaluate to $\\sqrt{3}$, so adding them gives $\\sqrt{3} + \\sqrt{3} = 2\\sqrt{3}$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{u}\\cdot\\mathbf{v} = 2\\sqrt{3}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathbf{u}\\cdot\\mathbf{v} = 4',
            correct: false,
            misconception:
              'Multiply matching components, not cross components: $1\\cdot\\sqrt{3} + \\sqrt{3}\\cdot 1 = 2\\sqrt{3}$, whereas $1\\cdot 1 + \\sqrt{3}\\cdot\\sqrt{3} = 4$ swaps $\\mathbf{v}$\'s entries.',
          },
          {
            id: 'd',
            latex: '\\mathbf{u}\\cdot\\mathbf{v} = \\begin{bmatrix} \\sqrt{3} \\\\ \\sqrt{3} \\end{bmatrix}',
            correct: false,
            misconception:
              'The dot product collapses two vectors into a single scalar by summing the component products—it is not an elementwise vector.',
          },
        ],
        lockedLabel: 'Dot Product',
        lockedResultLatex:
          '\\textcolor{#22D3EE}{\\mathbf{u}}\\cdot\\textcolor{#F59E0B}{\\mathbf{v}} = \\textcolor{#34D399}{2\\sqrt{3}}',
        hint: 'Multiply matching entries and sum them: $1\\cdot\\sqrt{3} + \\sqrt{3}\\cdot 1$.',
      },
      {
        stepType: 'vector_norms',
        badge: 'Compute Vector Lengths',
        prompt:
          'Compute the Euclidean norms $\\|\\mathbf{u}\\| = \\sqrt{u_1^2 + u_2^2}$ and $\\|\\mathbf{v}\\| = \\sqrt{v_1^2 + v_2^2}$.',
        highlightLatex:
          '\\|\\textcolor{#22D3EE}{\\mathbf{u}}\\| = \\sqrt{1^2 + (\\sqrt{3})^2}, \\qquad \\|\\textcolor{#F59E0B}{\\mathbf{v}}\\| = \\sqrt{(\\sqrt{3})^2 + 1^2}',
        options: [
          {
            id: 'a',
            latex: '\\|\\mathbf{u}\\| = 4, \\quad \\|\\mathbf{v}\\| = 4',
            correct: false,
            misconception:
              'Remember to take the square root! $1^2 + (\\sqrt{3})^2 = 4$ is $\\|\\mathbf{u}\\|^2$, so $\\|\\mathbf{u}\\| = \\sqrt{4} = 2$.',
          },
          {
            id: 'b',
            latex: '\\|\\mathbf{u}\\| = 1 + \\sqrt{3}, \\quad \\|\\mathbf{v}\\| = 1 + \\sqrt{3}',
            correct: false,
            misconception:
              '$\\sqrt{a^2 + b^2} \\neq |a| + |b|$! Square each component first: $1 + 3 = 4$, then take the square root.',
          },
          {
            id: 'c',
            latex: '\\|\\mathbf{u}\\| = 2, \\quad \\|\\mathbf{v}\\| = 2',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\|\\mathbf{u}\\| = \\sqrt{2}, \\quad \\|\\mathbf{v}\\| = \\sqrt{2}',
            correct: false,
            misconception:
              'Squaring $\\sqrt{3}$ gives $3$, not $1$; therefore $\\sqrt{1 + 3} = \\sqrt{4} = 2$.',
          },
        ],
        lockedLabel: 'Norms',
        lockedResultLatex:
          '\\|\\textcolor{#22D3EE}{\\mathbf{u}}\\| = \\textcolor{#34D399}{2}, \\quad \\|\\textcolor{#F59E0B}{\\mathbf{v}}\\| = \\textcolor{#34D399}{2}',
        hint: 'Notice $(\\sqrt{3})^2 = 3$, so $1^2 + (\\sqrt{3})^2 = 1 + 3 = 4$.',
      },
      {
        stepType: 'cosine_angle',
        badge: 'Solve for cos θ',
        prompt:
          'Substitute $\\mathbf{u}\\cdot\\mathbf{v} = 2\\sqrt{3}$ and $\\|\\mathbf{u}\\| = \\|\\mathbf{v}\\| = 2$ into $\\cos\\theta = \\frac{\\mathbf{u}\\cdot\\mathbf{v}}{\\|\\mathbf{u}\\|\\|\\mathbf{v}\\|}$.',
        highlightLatex:
          '\\cos\\theta = \\frac{\\textcolor{#34D399}{2\\sqrt{3}}}{\\textcolor{#22D3EE}{2}\\cdot\\textcolor{#F59E0B}{2}}',
        options: [
          {
            id: 'a',
            latex: '\\cos\\theta = \\frac{\\sqrt{3}}{2}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\cos\\theta = \\sqrt{3}',
            correct: false,
            misconception:
              'Divide by the product of BOTH norms: $2 \\cdot 2 = 4$, so $\\frac{2\\sqrt{3}}{4} = \\frac{\\sqrt{3}}{2}$. Also $\\cos\\theta$ can never exceed $1$!',
          },
          {
            id: 'c',
            latex: '\\cos\\theta = \\frac{1}{2}',
            correct: false,
            misconception:
              'Don\'t drop the $\\sqrt{3}$ in the numerator: $\\frac{2\\sqrt{3}}{4}$ simplifies to $\\frac{\\sqrt{3}}{2}$, not $\\frac{1}{2}$.',
          },
          {
            id: 'd',
            latex: '\\cos\\theta = \\frac{\\sqrt{3}}{4}',
            correct: false,
            misconception:
              'Keep the factor of $2$ in $\\mathbf{u}\\cdot\\mathbf{v} = 2\\sqrt{3}$; canceling $2/4$ leaves $\\frac{\\sqrt{3}}{2}$.',
          },
        ],
        lockedLabel: 'Cosine Ratio',
        lockedResultLatex: '\\cos\\theta = \\textcolor{#34D399}{\\frac{\\sqrt{3}}{2}}',
        hint: 'Multiply the norms in the denominator ($2 \\times 2 = 4$) and reduce $\\frac{2\\sqrt{3}}{4}$.',
      },
      {
        stepType: 'extract_angle',
        badge: 'Extract Exact Angle',
        prompt:
          'Evaluate $\\theta = \\arccos\\!\\left(\\frac{\\sqrt{3}}{2}\\right)$ on $[0, \\pi]$.',
        highlightLatex:
          '\\theta = \\arccos\\!\\left(\\textcolor{#34D399}{\\frac{\\sqrt{3}}{2}}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\theta = 60^\\circ = \\frac{\\pi}{3}',
            correct: false,
            misconception:
              '$\\cos(60^\\circ) = \\frac{1}{2}$ (that\'s $\\sin(30^\\circ)$). Cosine equals $\\frac{\\sqrt{3}}{2}$ at the smaller angle $30^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\theta = 45^\\circ = \\frac{\\pi}{4}',
            correct: false,
            misconception:
              'At $45^\\circ$, $\\cos(45^\\circ) = \\frac{\\sqrt{2}}{2} \\approx 0.707$, whereas $\\frac{\\sqrt{3}}{2} \\approx 0.866$ corresponds to $30^\\circ$.',
          },
          {
            id: 'c',
            latex: '\\theta = 90^\\circ = \\frac{\\pi}{2}',
            correct: false,
            misconception:
              'Perpendicular vectors have $\\cos\\theta = 0$ ($\\mathbf{u}\\cdot\\mathbf{v} = 0$); here the dot product is positive and close to $\\|\\mathbf{u}\\|\\|\\mathbf{v}\\|$.',
          },
          {
            id: 'd',
            latex: '\\theta = 30^\\circ = \\frac{\\pi}{6}',
            correct: true,
          },
        ],
        lockedLabel: 'Exact Angle',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\theta = 30^\\circ = \\frac{\\pi}{6}\\text{ rad}}',
        hint: '$\\mathbf{u}$ sits at $60^\\circ$ and $\\mathbf{v}$ sits at $30^\\circ$ from the $+x$ axis—their gap is $60^\\circ - 30^\\circ$.',
      },
    ],
  },

  {
    id: 'la1-projection',
    tier: 'vectors',
    tierLabel: 'Vectors',
    title: 'Orthogonal Vector Projection',
    mechatronicsContext:
      'Projecting a gripper contact force $\\mathbf{a}$ onto a rail direction $\\mathbf{b}$ splits it into the driving component $\\operatorname{proj}_{\\mathbf{b}}\\mathbf{a}$ along the track and the normal bearing load $\\mathbf{e} \\perp \\mathbf{b}$.',
    expressionLatex:
      '\\text{Project } \\mathbf{a} = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix} \\text{ onto } \\mathbf{b} = \\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}',
    finalAnswerLatex:
      '\\operatorname{proj}_{\\mathbf{b}}\\mathbf{a} = \\begin{bmatrix} 4 \\\\ 2 \\end{bmatrix}, \\qquad \\mathbf{e} = \\mathbf{a} - \\mathbf{p} = \\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}',
    verifyPlot: {
      kind: 'projection',
      a: [3, 4],
      b: [2, 1],
      p: [4, 2],
      e: [-1, 2],
      metrics: [
        { label: 'Scale α', value: '10 / 5 = 2.000' },
        { label: 'proj_b(a)', value: '[4, 2]ᵀ' },
        { label: 'Residual e', value: '[-1, 2]ᵀ' },
        { label: 'e · b Check', value: '0.0000 ⊥ ✓' },
      ],
    },
    steps: [
      {
        stepType: 'inner_products',
        badge: 'Compute Dot Products',
        prompt:
          'Compute the numerator $\\mathbf{a}\\cdot\\mathbf{b}$ and denominator $\\mathbf{b}\\cdot\\mathbf{b} = \\|\\mathbf{b}\\|^2$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\mathbf{a}} = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}, \\qquad \\textcolor{#F59E0B}{\\mathbf{b}} = \\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{a}\\cdot\\mathbf{b} = 10, \\quad \\mathbf{b}\\cdot\\mathbf{b} = 5',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathbf{a}\\cdot\\mathbf{b} = 10, \\quad \\mathbf{b}\\cdot\\mathbf{b} = 25',
            correct: false,
            misconception:
              '$25$ is $\\|\\mathbf{a}\\|^2 = 3^2 + 4^2$! Because we project ONTO $\\mathbf{b}$, the denominator uses $\\mathbf{b}\\cdot\\mathbf{b} = 2^2 + 1^2 = 5$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{a}\\cdot\\mathbf{b} = 11, \\quad \\mathbf{b}\\cdot\\mathbf{b} = 5',
            correct: false,
            misconception:
              'Check the arithmetic: $3(2) + 4(1) = 6 + 4 = 10$, whereas $3(1) + 4(2) = 11$ swaps the components of $\\mathbf{b}$.',
          },
          {
            id: 'd',
            latex: '\\mathbf{a}\\cdot\\mathbf{b} = 10, \\quad \\mathbf{b}\\cdot\\mathbf{b} = \\sqrt{5}',
            correct: false,
            misconception:
              'The dot product $\\mathbf{b}\\cdot\\mathbf{b}$ is the SQUARED norm $\\|\\mathbf{b}\\|^2 = 5$ (no square root).',
          },
        ],
        lockedLabel: 'Dot Terms',
        lockedResultLatex:
          '\\mathbf{a}\\cdot\\mathbf{b} = \\textcolor{#34D399}{10}, \\quad \\|\\mathbf{b}\\|^2 = \\textcolor{#34D399}{5}',
        hint: 'Evaluate $3(2) + 4(1)$ for $\\mathbf{a}\\cdot\\mathbf{b}$ and $2^2 + 1^2$ for $\\mathbf{b}\\cdot\\mathbf{b}$.',
      },
      {
        stepType: 'projection_scale',
        badge: 'Compute Scalar Factor α',
        prompt:
          'Form the projection multiplier $\\alpha = \\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\mathbf{b}\\cdot\\mathbf{b}}$.',
        highlightLatex:
          '\\alpha = \\frac{\\textcolor{#22D3EE}{\\mathbf{a}}\\cdot\\textcolor{#F59E0B}{\\mathbf{b}}}{\\textcolor{#F59E0B}{\\mathbf{b}}\\cdot\\textcolor{#F59E0B}{\\mathbf{b}}} = \\frac{10}{5}',
        options: [
          {
            id: 'a',
            latex: '\\alpha = \\frac{1}{2}',
            correct: false,
            misconception:
              'The ratio is upside down! Put $\\mathbf{a}\\cdot\\mathbf{b} = 10$ on top and $\\mathbf{b}\\cdot\\mathbf{b} = 5$ on the bottom.',
          },
          {
            id: 'b',
            latex: '\\alpha = 2',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\alpha = 2\\sqrt{5}',
            correct: false,
            misconception:
              'Dividing by $\\|\\mathbf{b}\\|$ gives the scalar length along $\\hat{\\mathbf{b}}$, but multiplying the unnormalized vector $\\mathbf{b}$ requires dividing by $\\|\\mathbf{b}\\|^2 = 5$.',
          },
          {
            id: 'd',
            latex: '\\alpha = \\frac{2}{5}',
            correct: false,
            misconception:
              'You divided by $\\|\\mathbf{a}\\|^2 = 25$ ($10/25 = 2/5$) instead of $\\|\\mathbf{b}\\|^2 = 5$.',
          },
        ],
        lockedLabel: 'Multiplier',
        lockedResultLatex: '\\alpha = \\frac{10}{5} = \\textcolor{#34D399}{2}',
        hint: 'Divide $\\mathbf{a}\\cdot\\mathbf{b} = 10$ by $\\|\\mathbf{b}\\|^2 = 5$.',
      },
      {
        stepType: 'projection_vector',
        badge: 'Form Projection Vector p',
        prompt:
          'Scale the target direction $\\mathbf{b}$ by $\\alpha = 2$ to get $\\mathbf{p} = \\operatorname{proj}_{\\mathbf{b}}\\mathbf{a} = \\alpha\\mathbf{b}$.',
        highlightLatex:
          '\\mathbf{p} = \\textcolor{#34D399}{2}\\,\\textcolor{#F59E0B}{\\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{p} = \\begin{bmatrix} 6 \\\\ 8 \\end{bmatrix}',
            correct: false,
            misconception:
              'You scaled $\\mathbf{a}$ instead of $\\mathbf{b}$! The projection must lie along the target line spanned by $\\mathbf{b}$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{p} = \\begin{bmatrix} 4 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Scalar multiplication scales EVERY component of $\\mathbf{b}$, so both $2$ and $1$ are multiplied by $2$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{p} = \\begin{bmatrix} 4 \\\\ 2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathbf{p} = \\begin{bmatrix} 2 \\\\ 4 \\end{bmatrix}',
            correct: false,
            misconception:
              'Preserve the entry order of $\\mathbf{b} = [2, 1]^T$: multiplying by $2$ gives $[4, 2]^T$.',
          },
        ],
        lockedLabel: 'Projection',
        lockedResultLatex:
          '\\operatorname{proj}_{\\mathbf{b}}\\mathbf{a} = \\textcolor{#34D399}{\\begin{bmatrix} 4 \\\\ 2 \\end{bmatrix}}',
        hint: 'Multiply both entries of $\\mathbf{b} = [2, 1]^T$ by $\\alpha = 2$.',
      },
      {
        stepType: 'orthogonal_residual',
        badge: 'Verify Orthogonal Residual e',
        prompt:
          'Compute the orthogonal error $\\mathbf{e} = \\mathbf{a} - \\mathbf{p}$ and confirm $\\mathbf{e}\\cdot\\mathbf{b} = 0$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{\\mathbf{e}} = \\textcolor{#22D3EE}{\\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}} - \\textcolor{#34D399}{\\begin{bmatrix} 4 \\\\ 2 \\end{bmatrix}}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{e} = \\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is $\\mathbf{p} - \\mathbf{a}$ (opposite sign)! Subtract $\\mathbf{p}$ from $\\mathbf{a}$: $3 - 4 = -1$ and $4 - 2 = 2$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{e} = \\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $\\mathbf{e}\\cdot\\mathbf{b} = 1(2) + 2(1) = 4 \\neq 0$! Keep the negative sign in $3 - 4 = -1$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{e} = \\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix} \\quad (\\mathbf{e}\\cdot\\mathbf{b} = 0)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathbf{e} = \\begin{bmatrix} -1 \\\\ 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'In the second component, $4 - 2 = 2$ (not $4 - 1 = 3$). Check orthogonality: $(-1)(2) + (2)(1) = 0$.',
          },
        ],
        lockedLabel: 'Residual ⊥ b',
        lockedResultLatex:
          '\\mathbf{e} = \\textcolor{#34D399}{\\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}}, \\quad \\mathbf{e}\\cdot\\mathbf{b} = 0',
        hint: 'Subtract entry by entry: $[3 - 4,\\; 4 - 2]^T$, then dot with $[2, 1]^T$ to verify zero.',
      },
    ],
  },

  {
    id: 'la1-cross-torque',
    tier: 'vectors',
    tierLabel: 'Vectors',
    title: '3D Cross Product & Actuator Torque',
    mechatronicsContext:
      'A robotic wrist lever arm $\\mathbf{r} = [2, 1, 0]^T\\,\\text{m}$ experiences an end-effector payload force $\\mathbf{F} = [0, 3, 4]^T\\,\\text{N}$; the joint servo must resist the 3D torque $\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F}$.',
    expressionLatex:
      '\\mathbf{r} = \\begin{bmatrix} 2 \\\\ 1 \\\\ 0 \\end{bmatrix}\\text{ m}, \\quad \\mathbf{F} = \\begin{bmatrix} 0 \\\\ 3 \\\\ 4 \\end{bmatrix}\\text{ N}, \\quad \\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F}',
    finalAnswerLatex:
      '\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F} = \\begin{bmatrix} 4 \\\\ -8 \\\\ 6 \\end{bmatrix}\\text{ N}\\cdot\\text{m} \\qquad (\\boldsymbol{\\tau}\\cdot\\mathbf{r} = 0)',
    verifyPlot: {
      kind: 'vectors-3d',
      r: [2, 1, 0],
      F: [0, 3, 4],
      tau: [4, -8, 6],
      metrics: [
        { label: 'Torque τ', value: '[4, -8, 6]ᵀ N·m' },
        { label: '‖τ‖ Mag', value: '10.7703 (2√29)' },
        { label: 'τ · r Check', value: '0.0000 ⊥ ✓' },
        { label: 'τ · F Check', value: '0.0000 ⊥ ✓' },
      ],
    },
    steps: [
      {
        stepType: 'cross_x',
        badge: 'Compute τₓ Component',
        prompt:
          'Expand the $\\hat{\\mathbf{i}}$-minor of $\\det\\begin{bmatrix} \\hat{\\mathbf{i}} & \\hat{\\mathbf{j}} & \\hat{\\mathbf{k}} \\\\ 2 & 1 & 0 \\\\ 0 & 3 & 4 \\end{bmatrix}$ to find $\\tau_x = r_y F_z - r_z F_y$.',
        highlightLatex:
          '\\tau_x = +\\det\\begin{bmatrix} \\textcolor{#22D3EE}{1} & \\textcolor{#22D3EE}{0} \\\\ \\textcolor{#F59E0B}{3} & \\textcolor{#F59E0B}{4} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\tau_x = -4',
            correct: false,
            misconception:
              'The $\\hat{\\mathbf{i}}$ cofactor carries a $+$ sign: $+(1\\cdot 4 - 0\\cdot 3) = +4$.',
          },
          {
            id: 'b',
            latex: '\\tau_x = 4',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\tau_x = 0',
            correct: false,
            misconception:
              'Don\'t multiply $r_x F_x = 2\\cdot 0$! Cross-product components combine the OTHER two coordinates: $r_y F_z - r_z F_y = 4$.',
          },
          {
            id: 'd',
            latex: '\\tau_x = 1',
            correct: false,
            misconception:
              'Multiply along the diagonals of the $2\\times 2$ minor: $1(4) - 0(3) = 4$, not $4 - 3 = 1$.',
          },
        ],
        lockedLabel: 'x-Torque',
        lockedResultLatex: '\\tau_x = 1(4) - 0(3) = \\textcolor{#34D399}{4}',
        hint: 'Cover Row 1 and Column 1, then take the $2\\times 2$ determinant $(1)(4) - (0)(3)$.',
      },
      {
        stepType: 'cross_y',
        badge: 'Compute τᵧ (Watch Sign!)',
        prompt:
          'Expand the $\\hat{\\mathbf{j}}$-minor with its alternating minus sign: $\\tau_y = -(r_x F_z - r_z F_x)$.',
        highlightLatex:
          '\\tau_y = \\textcolor{#F59E0B}{-}\\det\\begin{bmatrix} \\textcolor{#22D3EE}{2} & \\textcolor{#22D3EE}{0} \\\\ \\textcolor{#F59E0B}{0} & \\textcolor{#F59E0B}{4} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\tau_y = 8',
            correct: false,
            misconception:
              'Classic cross-product trap! The middle $\\hat{\\mathbf{j}}$-component ALWAYS flips sign: $-(2\\cdot 4 - 0\\cdot 0) = -8$.',
          },
          {
            id: 'b',
            latex: '\\tau_y = -6',
            correct: false,
            misconception:
              'The minor uses columns $x$ and $z$: $2(4) - 0(0) = 8$, negated to $-8$.',
          },
          {
            id: 'c',
            latex: '\\tau_y = -8',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\tau_y = 3',
            correct: false,
            misconception:
              'Never multiply $r_y F_y = 1\\cdot 3$ for a cross product; use $-(r_x F_z - r_z F_x) = -8$.',
          },
        ],
        lockedLabel: 'y-Torque',
        lockedResultLatex: '\\tau_y = -(2\\cdot 4 - 0\\cdot 0) = \\textcolor{#34D399}{-8}',
        hint: 'Remember the checkerboard sign pattern $(+, -, +)$ across the top row of the determinant.',
      },
      {
        stepType: 'cross_z',
        badge: 'Compute τ_z & Assemble τ',
        prompt:
          'Expand the $\\hat{\\mathbf{k}}$-minor $\\tau_z = +(r_x F_y - r_y F_x)$ and assemble $\\boldsymbol{\\tau}$.',
        highlightLatex:
          '\\tau_z = +\\det\\begin{bmatrix} \\textcolor{#22D3EE}{2} & \\textcolor{#22D3EE}{1} \\\\ \\textcolor{#F59E0B}{0} & \\textcolor{#F59E0B}{3} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\boldsymbol{\\tau} = \\begin{bmatrix} 4 \\\\ -8 \\\\ 6 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\boldsymbol{\\tau} = \\begin{bmatrix} 4 \\\\ -8 \\\\ -6 \\end{bmatrix}',
            correct: false,
            misconception:
              'The $\\hat{\\mathbf{k}}$-component has a $+$ sign: $+(2\\cdot 3 - 1\\cdot 0) = +6$.',
          },
          {
            id: 'c',
            latex: '\\boldsymbol{\\tau} = \\begin{bmatrix} 4 \\\\ 8 \\\\ 6 \\end{bmatrix}',
            correct: false,
            misconception:
              'Keep the locked $\\tau_y = -8$ from Step 2; flipping it breaks orthogonality with $\\mathbf{r}$.',
          },
          {
            id: 'd',
            latex: '\\boldsymbol{\\tau} = \\begin{bmatrix} 4 \\\\ -8 \\\\ 5 \\end{bmatrix}',
            correct: false,
            misconception:
              'In the $2\\times 2$ minor, $2(3) - 1(0) = 6$, not $6 - 1 = 5$.',
          },
        ],
        lockedLabel: 'Torque Vector',
        lockedResultLatex:
          '\\boldsymbol{\\tau} = \\textcolor{#34D399}{\\begin{bmatrix} 4 \\\\ -8 \\\\ 6 \\end{bmatrix}}\\text{ N}\\cdot\\text{m}',
        hint: 'Compute $2(3) - 1(0) = 6$ and stack $[\\tau_x, \\tau_y, \\tau_z]^T$.',
      },
      {
        stepType: 'verify_orthogonality',
        badge: 'Verify Orthogonality',
        prompt:
          'Verify that $\\boldsymbol{\\tau}$ is perpendicular to the lever arm $\\mathbf{r}$ by computing $\\boldsymbol{\\tau}\\cdot\\mathbf{r}$.',
        highlightLatex:
          '\\textcolor{#34D399}{\\begin{bmatrix} 4 \\\\ -8 \\\\ 6 \\end{bmatrix}} \\cdot \\textcolor{#22D3EE}{\\begin{bmatrix} 2 \\\\ 1 \\\\ 0 \\end{bmatrix}} = \\;?',
        options: [
          {
            id: 'a',
            latex: '4(2) + (-8)(1) + 6(0) = 16 \\neq 0',
            correct: false,
            misconception:
              'Watch the sign of $(-8)(1) = -8$: $8 - 8 + 0 = 0$, not $8 + 8 = 16$.',
          },
          {
            id: 'b',
            latex: '4(2) + (-8)(1) + 6(0) = 6',
            correct: false,
            misconception:
              'The third product is $6 \\cdot 0 = 0$, so $8 - 8 + 0 = 0$.',
          },
          {
            id: 'c',
            latex: '4(2) + (-8)(1) + 6(0) = 0 \\;\\;(\\boldsymbol{\\tau} \\perp \\mathbf{r})',
            correct: true,
          },
          {
            id: 'd',
            latex: '4(2) + (-8)(1) + 6(0) = -8',
            correct: false,
            misconception:
              'Include the first product $4(2) = 8$, which cancels $-8$ to give exactly $0$.',
          },
        ],
        lockedLabel: 'Orthogonal Proof',
        lockedResultLatex:
          '\\boldsymbol{\\tau}\\cdot\\mathbf{r} = \\textcolor{#34D399}{0}, \\quad \\boldsymbol{\\tau}\\cdot\\mathbf{F} = \\textcolor{#34D399}{0}',
        hint: 'Sum $4(2) + (-8)(1) + 6(0)$—any valid cross product MUST dot to $0$ with both inputs.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: MATRICES & LINEAR SYSTEMS (3 problems)
  // =========================================================================
  {
    id: 'la2-det-inverse',
    tier: 'matrices',
    tierLabel: 'Matrices',
    title: '2×2 Determinant & Matrix Inverse',
    mechatronicsContext:
      'Inverting a $2\\times 2$ manipulator Jacobian $J$ maps desired Cartesian tip velocity $\\dot{\\mathbf{x}}$ back to joint motor speeds $\\dot{\\mathbf{q}} = J^{-1}\\dot{\\mathbf{x}}$ whenever $\\det(J) \\neq 0$.',
    expressionLatex:
      'A = \\begin{bmatrix} 3 & 2 \\\\ 1 & 2 \\end{bmatrix}, \\qquad \\text{find } \\det(A) \\text{ and } A^{-1}',
    finalAnswerLatex:
      '\\det(A) = 4, \\qquad A^{-1} = \\frac{1}{4}\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
    verifyPlot: {
      kind: 'matrix',
      A: [
        [3, 2],
        [1, 2],
      ],
      det: 4,
      showInverseNote: true,
      metrics: [
        { label: 'det(A) Area', value: '4.0000' },
        { label: 'det(A⁻¹)', value: '0.2500 (1/4)' },
        { label: 'A e₁, A e₂', value: '[3,1]ᵀ, [2,2]ᵀ' },
        { label: '‖AA⁻¹ - I‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'det_2x2',
        badge: 'Compute Determinant',
        prompt:
          'Compute $\\det(A) = ad - bc$ to verify $A$ is nonsingular (invertible).',
        highlightLatex:
          '\\det\\begin{bmatrix} \\textcolor{#22D3EE}{3} & \\textcolor{#F59E0B}{2} \\\\ \\textcolor{#F59E0B}{1} & \\textcolor{#22D3EE}{2} \\end{bmatrix} = (\\textcolor{#22D3EE}{3})(\\textcolor{#22D3EE}{2}) - (\\textcolor{#F59E0B}{2})(\\textcolor{#F59E0B}{1})',
        options: [
          {
            id: 'a',
            latex: '\\det(A) = 8',
            correct: false,
            misconception:
              'Subtract the anti-diagonal product $bc = 2$, don\'t add it: $6 - 2 = 4$, not $6 + 2 = 8$.',
          },
          {
            id: 'b',
            latex: '\\det(A) = 4 \\neq 0 \\;\\;(\\text{invertible})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\det(A) = -4',
            correct: false,
            misconception:
              'Take main diagonal minus off-diagonal ($ad - bc = 6 - 2 = +4$), not $bc - ad$.',
          },
          {
            id: 'd',
            latex: '\\det(A) = 5',
            correct: false,
            misconception:
              '$3 + 2 = 5$ is the trace $\\operatorname{tr}(A)$, not the determinant! Use $ad - bc = 3(2) - 2(1) = 4$.',
          },
        ],
        lockedLabel: 'Determinant',
        lockedResultLatex: '\\det(A) = 6 - 2 = \\textcolor{#34D399}{4} \\neq 0',
        hint: 'Multiply the main diagonal $(3)(2)$ and subtract the off-diagonal $(2)(1)$.',
      },
      {
        stepType: 'adjugate_2x2',
        badge: 'Form Adjugate Matrix',
        prompt:
          'Swap the main diagonal entries ($a \\leftrightarrow d$) and negate the off-diagonal entries ($-b, -c$).',
        highlightLatex:
          '\\operatorname{adj}\\begin{bmatrix} \\textcolor{#22D3EE}{3} & \\textcolor{#F59E0B}{2} \\\\ \\textcolor{#F59E0B}{1} & \\textcolor{#22D3EE}{2} \\end{bmatrix} = \\begin{bmatrix} \\textcolor{#22D3EE}{d} & \\textcolor{#F59E0B}{-b} \\\\ \\textcolor{#F59E0B}{-c} & \\textcolor{#22D3EE}{a} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\begin{bmatrix} 3 & -2 \\\\ -1 & 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'You negated the off-diagonals but forgot to SWAP $3$ and $2$ on the main diagonal!',
          },
          {
            id: 'b',
            latex: '\\begin{bmatrix} 2 & 2 \\\\ 1 & 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'You swapped the main diagonal, but the off-diagonals must be NEGATED to $-2$ and $-1$.',
          },
          {
            id: 'c',
            latex: '\\begin{bmatrix} 2 & -1 \\\\ -2 & 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'Don\'t swap the off-diagonals! Only negate them in place: $-b = -2$ stays top-right and $-c = -1$ stays bottom-left.',
          },
          {
            id: 'd',
            latex: '\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
            correct: true,
          },
        ],
        lockedLabel: 'Adjugate',
        lockedResultLatex:
          '\\operatorname{adj}(A) = \\textcolor{#34D399}{\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}}',
        hint: 'Swap top-left ($3$) with bottom-right ($2$), and flip signs on $2$ and $1$ without moving them.',
      },
      {
        stepType: 'scale_inverse',
        badge: 'Divide by det(A)',
        prompt:
          'Combine $A^{-1} = \\frac{1}{\\det(A)}\\operatorname{adj}(A)$ and check that $A A^{-1} = I$.',
        highlightLatex:
          'A^{-1} = \\frac{1}{\\textcolor{#34D399}{4}}\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A^{-1} = 4\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'Divide by $\\det(A) = 4$ (multiply by $\\frac{1}{4}$), don\'t multiply by $4$—otherwise $A A^{-1} = 16 I$.',
          },
          {
            id: 'b',
            latex: 'A^{-1} = \\frac{1}{4}\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A^{-1} = \\begin{bmatrix} 1/3 & 1/2 \\\\ 1 & 1/2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Matrix inversion is NOT taking reciprocals entry-by-entry! Only diagonal matrices invert entrywise.',
          },
          {
            id: 'd',
            latex: 'A^{-1} = -\\frac{1}{4}\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}',
            correct: false,
            misconception:
              '$\\det(A) = +4$ is positive, so the prefactor is $+\\frac{1}{4}$, giving $A A^{-1} = +I$.',
          },
        ],
        lockedLabel: 'Inverse A⁻¹',
        lockedResultLatex:
          'A^{-1} = \\textcolor{#34D399}{\\frac{1}{4}\\begin{bmatrix} 2 & -2 \\\\ -1 & 3 \\end{bmatrix}}',
        hint: 'Multiply the locked adjugate by $\\frac{1}{\\det(A)} = \\frac{1}{4}$.',
      },
    ],
  },

  {
    id: 'la2-gauss-rref',
    tier: 'matrices',
    tierLabel: 'Matrices',
    title: 'Solving Ax = b via Elimination',
    mechatronicsContext:
      'Solving Kirchhoff node-voltage equations $G\\mathbf{v} = \\mathbf{i}$ in a 2-node resistive sensor bridge reduces to Gaussian elimination on a $2\\times 2$ linear system.',
    expressionLatex:
      '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}\\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 5 \\\\ 11 \\end{bmatrix}',
    finalAnswerLatex:
      '\\mathbf{x} = \\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix} \\qquad \\left(1\\begin{bmatrix} 1 \\\\ 3 \\end{bmatrix} + 2\\begin{bmatrix} 2 \\\\ 4 \\end{bmatrix} = \\begin{bmatrix} 5 \\\\ 11 \\end{bmatrix}\\right)',
    verifyPlot: {
      kind: 'linear-system',
      A: [
        [1, 2],
        [3, 4],
      ],
      b: [5, 11],
      x: [1, 2],
      metrics: [
        { label: 'Solution x', value: '[1, 2]ᵀ' },
        { label: 'det(A)', value: '-2.0000 ≠ 0' },
        { label: 'Check Ax', value: '[5, 11]ᵀ' },
        { label: '‖Ax - b‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'row_elimination',
        badge: 'Eliminate Below Pivot',
        prompt:
          'Apply $R_2 \\leftarrow R_2 - 3R_1$ to zero out the $(2,1)$ entry in the augmented matrix $[A \\mid \\mathbf{b}]$.',
        highlightLatex:
          '\\left[\\begin{array}{cc|c} \\textcolor{#22D3EE}{1} & \\textcolor{#22D3EE}{2} & \\textcolor{#22D3EE}{5} \\\\ \\textcolor{#F59E0B}{3} & \\textcolor{#F59E0B}{4} & \\textcolor{#F59E0B}{11} \\end{array}\\right] \\xrightarrow{R_2 - 3R_1}',
        options: [
          {
            id: 'a',
            latex: '\\left[\\begin{array}{cc|c} 1 & 2 & 5 \\\\ 0 & -2 & -4 \\end{array}\\right]',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\left[\\begin{array}{cc|c} 1 & 2 & 5 \\\\ 0 & -2 & 11 \\end{array}\\right]',
            correct: false,
            misconception:
              'You must apply $R_2 - 3R_1$ to the right-hand side column too! $11 - 3(5) = -4$, not $11$.',
          },
          {
            id: 'c',
            latex: '\\left[\\begin{array}{cc|c} 1 & 2 & 5 \\\\ 0 & 2 & 4 \\end{array}\\right]',
            correct: false,
            misconception:
              'Watch the subtraction order: $4 - 3(2) = -2$ and $11 - 3(5) = -4$ (you computed $3R_1 - R_2$).',
          },
          {
            id: 'd',
            latex: '\\left[\\begin{array}{cc|c} 1 & 2 & 5 \\\\ 0 & -2 & 6 \\end{array}\\right]',
            correct: false,
            misconception:
              'In the augmented column, subtract $3(5) = 15$ from $11$, not $1(5) = 5$: $11 - 15 = -4$.',
          },
        ],
        lockedLabel: 'Row Echelon',
        lockedResultLatex:
          '\\left[\\begin{array}{cc|c} 1 & 2 & 5 \\\\ 0 & \\textcolor{#34D399}{-2} & \\textcolor{#34D399}{-4} \\end{array}\\right]',
        hint: 'Subtract $3\\times [1, 2, 5] = [3, 6, 15]$ from Row 2: $[3, 4, 11] - [3, 6, 15]$.',
      },
      {
        stepType: 'solve_pivot2',
        badge: 'Solve Second Pivot x₂',
        prompt:
          'Scale Row 2 by $-\\frac{1}{2}$ (solving $-2x_2 = -4$) to isolate $x_2$.',
        highlightLatex:
          '\\textcolor{#34D399}{-2}\\,x_2 = \\textcolor{#34D399}{-4}',
        options: [
          {
            id: 'a',
            latex: 'x_2 = -2',
            correct: false,
            misconception:
              'A negative divided by a negative is positive: $\\frac{-4}{-2} = +2$.',
          },
          {
            id: 'b',
            latex: 'x_2 = \\frac{1}{2}',
            correct: false,
            misconception:
              'Divide the right-hand side by the pivot: $x_2 = \\frac{-4}{-2} = 2$, not $\\frac{-2}{-4}$.',
          },
          {
            id: 'c',
            latex: 'x_2 = 2',
            correct: true,
          },
          {
            id: 'd',
            latex: 'x_2 = 8',
            correct: false,
            misconception:
              'Divide $-4$ by $-2$ rather than multiplying them.',
          },
        ],
        lockedLabel: 'Second Variable',
        lockedResultLatex: 'x_2 = \\textcolor{#34D399}{2}',
        hint: 'Divide both sides of $-2x_2 = -4$ by $-2$.',
      },
      {
        stepType: 'back_substitute',
        badge: 'Back-Substitute for x₁',
        prompt:
          'Substitute $x_2 = 2$ into Row 1 ($x_1 + 2x_2 = 5$) to solve for $x_1$.',
        highlightLatex:
          'x_1 + 2(\\textcolor{#34D399}{2}) = \\textcolor{#22D3EE}{5}',
        options: [
          {
            id: 'a',
            latex: 'x_1 = 9',
            correct: false,
            misconception:
              'Subtract $2(2) = 4$ from $5$, don\'t add it: $x_1 = 5 - 4 = 1$.',
          },
          {
            id: 'b',
            latex: 'x_1 = 3',
            correct: false,
            misconception:
              'Multiply $x_2 = 2$ by its coefficient $2$ first: $x_1 = 5 - 2(2) = 1$, not $5 - 2 = 3$.',
          },
          {
            id: 'c',
            latex: 'x_1 = -1',
            correct: false,
            misconception:
              'Check the sign: $5 - 4 = +1$, not $-1$.',
          },
          {
            id: 'd',
            latex: 'x_1 = 1',
            correct: true,
          },
        ],
        lockedLabel: 'First Variable',
        lockedResultLatex: 'x_1 = 5 - 4 = \\textcolor{#34D399}{1}',
        hint: '$x_1 + 4 = 5$, so subtract $4$ from both sides.',
      },
      {
        stepType: 'verify_column_comb',
        badge: 'Verify Column Combination',
        prompt:
          'Verify $\\mathbf{x} = [1, 2]^T$ via the column picture $x_1\\mathbf{c}_1 + x_2\\mathbf{c}_2 = \\mathbf{b}$.',
        highlightLatex:
          '\\textcolor{#34D399}{1}\\begin{bmatrix} 1 \\\\ 3 \\end{bmatrix} + \\textcolor{#34D399}{2}\\begin{bmatrix} 2 \\\\ 4 \\end{bmatrix} = \\;?',
        options: [
          {
            id: 'a',
            latex: '\\begin{bmatrix} 3 \\\\ 7 \\end{bmatrix}',
            correct: false,
            misconception:
              'You forgot to multiply the second column by $x_2 = 2$: $1 + 2(2) = 5$ and $3 + 2(4) = 11$.',
          },
          {
            id: 'b',
            latex: '\\begin{bmatrix} 5 \\\\ 11 \\end{bmatrix} = \\mathbf{b} \\;\\checkmark',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\begin{bmatrix} 4 \\\\ 10 \\end{bmatrix}',
            correct: false,
            misconception:
              'You swapped $x_1$ and $x_2$: $2[1, 3]^T + 1[2, 4]^T = [4, 10]^T \\neq \\mathbf{b}$. Keep $x_1 = 1, x_2 = 2$.',
          },
          {
            id: 'd',
            latex: '\\begin{bmatrix} 5 \\\\ 7 \\end{bmatrix}',
            correct: false,
            misconception:
              'Scale the bottom entry of column 2 as well: $3 + 2(4) = 3 + 8 = 11$.',
          },
        ],
        lockedLabel: 'Verified Solution',
        lockedResultLatex:
          '\\mathbf{x} = \\textcolor{#34D399}{\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}} \\implies A\\mathbf{x} = \\mathbf{b}',
        hint: 'Add $[1, 3]^T + [4, 8]^T$ entrywise and compare to $\\mathbf{b} = [5, 11]^T$.',
      },
    ],
  },

  {
    id: 'la2-det3x3',
    tier: 'matrices',
    tierLabel: 'Matrices',
    title: '3×3 Cofactor Expansion & Singularity',
    mechatronicsContext:
      'For a 3-DOF delta robot, checking $\\det(J) \\neq 0$ guarantees the 3 column velocity vectors span a non-collapsed 3D volume so the end-effector is far from a kinematic singularity.',
    expressionLatex:
      'A = \\begin{bmatrix} 2 & 1 & 0 \\\\ 0 & 3 & 1 \\\\ 1 & 0 & 2 \\end{bmatrix}, \\qquad \\text{find } \\det(A)',
    finalAnswerLatex:
      '\\det(A) = 13 \\neq 0 \\implies A \\text{ is invertible (rank } 3\\text{)}',
    verifyPlot: {
      kind: 'det3x3',
      A: [
        [2, 1, 0],
        [0, 3, 1],
        [1, 0, 2],
      ],
      det: 13,
      metrics: [
        { label: 'Minor M₁₁', value: '6.0000' },
        { label: 'Cofactor C₁₂', value: '+1.0000' },
        { label: 'det(A) Vol', value: '13.0000' },
        { label: 'Rank / Inv', value: 'Rank 3 (Inv) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'cofactor_setup',
        badge: 'Set Up Row-1 Expansion',
        prompt:
          'Expand $\\det(A)$ along Row 1 (taking advantage of the zero entry $a_{13} = 0$) using checkerboard signs $(+, -, +)$.',
        highlightLatex:
          '\\det\\begin{bmatrix} \\textcolor{#22D3EE}{2} & \\textcolor{#F59E0B}{1} & \\textcolor{#34D399}{0} \\\\ 0 & 3 & 1 \\\\ 1 & 0 & 2 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '2\\det\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix} + 1\\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix} + 0',
            correct: false,
            misconception:
              'Watch the checkerboard cofactor signs! Position $(1, 2)$ has sign $(-1)^{1+2} = -1$, so the second term is SUBTRACTED.',
          },
          {
            id: 'b',
            latex: '2\\det\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix} - 1\\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix} + 0',
            correct: true,
          },
          {
            id: 'c',
            latex: '2\\det\\begin{bmatrix} 0 & 3 \\\\ 1 & 0 \\end{bmatrix} - 1\\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix} + 0',
            correct: false,
            misconception:
              'For $M_{11}$, delete Row 1 and Column 1, leaving $\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix}$, not columns 1–2.',
          },
          {
            id: 'd',
            latex: '2\\det\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix} - 0\\det\\begin{bmatrix} 1 & 0 \\\\ 0 & 2 \\end{bmatrix} + 1\\det\\begin{bmatrix} 1 & 0 \\\\ 3 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'That expands along Column 1 (which actually also gives $13$!), whereas the prompt asks for Row 1 with entries $2, 1, 0$.',
          },
        ],
        lockedLabel: 'Row-1 Expansion',
        lockedResultLatex:
          '2\\det\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix} - 1\\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix}',
        hint: 'Delete Row 1 and each column $j$ in turn, weighting by $(-1)^{1+j} a_{1j}$.',
      },
      {
        stepType: 'minor_11',
        badge: 'Evaluate First Minor M₁₁',
        prompt:
          'Compute $M_{11} = \\det\\begin{bmatrix} 3 & 1 \\\\ 0 & 2 \\end{bmatrix}$.',
        highlightLatex:
          'M_{11} = \\det\\begin{bmatrix} \\textcolor{#22D3EE}{3} & \\textcolor{#F59E0B}{1} \\\\ \\textcolor{#F59E0B}{0} & \\textcolor{#22D3EE}{2} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'M_{11} = 5',
            correct: false,
            misconception:
              'Multiply along the diagonals rather than adding: $3(2) - 1(0) = 6$.',
          },
          {
            id: 'b',
            latex: 'M_{11} = 6',
            correct: true,
          },
          {
            id: 'c',
            latex: 'M_{11} = -6',
            correct: false,
            misconception:
              'The main diagonal is $3(2) = +6$ and the off-diagonal is $1(0) = 0$.',
          },
          {
            id: 'd',
            latex: 'M_{11} = 12',
            correct: false,
            misconception:
              'Hold off multiplying by $a_{11} = 2$ until the final sum—the minor $M_{11}$ itself is $6$.',
          },
        ],
        lockedLabel: 'Minor M₁₁',
        lockedResultLatex: 'M_{11} = 3(2) - 1(0) = \\textcolor{#34D399}{6}',
        hint: 'Upper-triangular $2\\times 2$ determinants are simply the product of their diagonal entries.',
      },
      {
        stepType: 'cofactor_12',
        badge: 'Evaluate Minor M₁₂ & Sign',
        prompt:
          'Compute $M_{12} = \\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix}$ and apply the cofactor sign $C_{12} = (-1)^{1+2} M_{12}$.',
        highlightLatex:
          'C_{12} = \\textcolor{#F59E0B}{-}\\det\\begin{bmatrix} 0 & 1 \\\\ 1 & 2 \\end{bmatrix} = -\\big(0\\cdot 2 - 1\\cdot 1\\big)',
        options: [
          {
            id: 'a',
            latex: 'M_{12} = -1, \\quad C_{12} = -1',
            correct: false,
            misconception:
              'Remember to flip the sign for $C_{12} = -M_{12}$: negating $-1$ gives $+1$!',
          },
          {
            id: 'b',
            latex: 'M_{12} = 1, \\quad C_{12} = -1',
            correct: false,
            misconception:
              'Check $ad - bc = 0(2) - 1(1) = -1$ (negative), so $C_{12} = -(-1) = +1$.',
          },
          {
            id: 'c',
            latex: 'M_{12} = -1, \\quad C_{12} = +1',
            correct: true,
          },
          {
            id: 'd',
            latex: 'M_{12} = 2, \\quad C_{12} = -2',
            correct: false,
            misconception:
              '$0 \\cdot 2 = 0$, not $2$; thus $M_{12} = 0 - 1 = -1$.',
          },
        ],
        lockedLabel: 'Cofactor C₁₂',
        lockedResultLatex: 'M_{12} = -1 \\implies C_{12} = \\textcolor{#34D399}{+1}',
        hint: 'Two negatives multiply to a positive: $-(-1) = +1$.',
      },
      {
        stepType: 'det3x3_final',
        badge: 'Sum & Check Singularity',
        prompt:
          'Combine $\\det(A) = a_{11} M_{11} + a_{12} C_{12} + 0$ and classify invertibility.',
        highlightLatex:
          '\\det(A) = \\textcolor{#22D3EE}{2}(\\textcolor{#34D399}{6}) + \\textcolor{#F59E0B}{1}(\\textcolor{#34D399}{+1}) + 0',
        options: [
          {
            id: 'a',
            latex: '\\det(A) = 11 \\neq 0 \\;\\;(\\text{invertible})',
            correct: false,
            misconception:
              'You subtracted $1$ instead of adding $+1$: $2(6) - 1(-1) = 12 + 1 = 13$.',
          },
          {
            id: 'b',
            latex: '\\det(A) = 12 \\neq 0 \\;\\;(\\text{invertible})',
            correct: false,
            misconception:
              'The diagonal product is $2\\cdot 3\\cdot 2 = 12$, but $A$ is NOT triangular ($a_{31}=1$); include the $+1$ cofactor term to get $13$.',
          },
          {
            id: 'c',
            latex: '\\det(A) = 0 \\;\\;(\\text{singular})',
            correct: false,
            misconception:
              'Having a zero in $a_{13}$ does NOT make a matrix singular—the determinant sums to $13 \\neq 0$.',
          },
          {
            id: 'd',
            latex: '\\det(A) = 13 \\neq 0 \\;\\;(\\text{invertible, rank } 3)',
            correct: true,
          },
        ],
        lockedLabel: '3×3 Determinant',
        lockedResultLatex:
          '\\det(A) = 12 + 1 = \\textcolor{#34D399}{13 \\neq 0} \\;\\;(\\text{invertible})',
        hint: 'Compute $2(6) + 1(1)$; any square matrix with $\\det(A) \\neq 0$ is full-rank and invertible.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: EIGENVALUES & DIAGONALIZATION (4 problems)
  // =========================================================================
  {
    id: 'la3-eigenvalues-2x2',
    tier: 'eigen',
    tierLabel: 'Eigenvalues',
    title: 'Characteristic Polynomial & Real Eigenvalues',
    mechatronicsContext:
      'The eigenvalues of a continuous-time state matrix $A$ determine the system\'s natural growth or decay rates $e^{\\lambda t}$—any positive real eigenvalue $\\lambda > 0$ signals an unstable divergent mode requiring feedback control.',
    expressionLatex:
      'A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix}, \\qquad \\text{find } \\lambda_1, \\lambda_2',
    finalAnswerLatex:
      '\\lambda_1 = 5, \\quad \\lambda_2 = 2 \\qquad \\big(\\operatorname{tr}(A)=7,\\;\\det(A)=10\\big)',
    verifyPlot: {
      kind: 'eigen',
      A: [
        [4, 1],
        [2, 3],
      ],
      eigenpairs: [
        { lambda: 5, v: [1, 1], color: '#22D3EE', label: 'v₁ (λ=5)' },
        { lambda: 2, v: [1, -2], color: '#F59E0B', label: 'v₂ (λ=2)' },
      ],
      metrics: [
        { label: 'tr(A) = λ₁+λ₂', value: '5 + 2 = 7' },
        { label: 'det(A) = λ₁λ₂', value: '5 × 2 = 10' },
        { label: 'Eigenvalues', value: 'λ₁ = 5, λ₂ = 2' },
        { label: 'p(λ) Check', value: 'p(5)=p(2)=0 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'trace_det',
        badge: 'Compute Trace & Determinant',
        prompt:
          'Compute the two invariants $\\operatorname{tr}(A) = a_{11} + a_{22}$ and $\\det(A) = a_{11}a_{22} - a_{12}a_{21}$.',
        highlightLatex:
          'A = \\begin{bmatrix} \\textcolor{#22D3EE}{4} & \\textcolor{#F59E0B}{1} \\\\ \\textcolor{#F59E0B}{2} & \\textcolor{#22D3EE}{3} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\operatorname{tr}(A) = 7, \\quad \\det(A) = 10',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\operatorname{tr}(A) = 7, \\quad \\det(A) = 14',
            correct: false,
            misconception:
              'Subtract the off-diagonal product: $4(3) - 1(2) = 12 - 2 = 10$, not $12 + 2 = 14$.',
          },
          {
            id: 'c',
            latex: '\\operatorname{tr}(A) = 12, \\quad \\det(A) = 10',
            correct: false,
            misconception:
              'The trace is the SUM of the diagonal ($4 + 3 = 7$), not the product ($4 \\times 3 = 12$).',
          },
          {
            id: 'd',
            latex: '\\operatorname{tr}(A) = 5, \\quad \\det(A) = 10',
            correct: false,
            misconception:
              'Add the main diagonal entries $4$ and $3$ ($7$), not the first row ($4 + 1 = 5$).',
          },
        ],
        lockedLabel: 'Invariants',
        lockedResultLatex:
          '\\operatorname{tr}(A) = \\textcolor{#22D3EE}{7}, \\quad \\det(A) = \\textcolor{#F59E0B}{10}',
        hint: '$\\operatorname{tr}(A) = 4 + 3$ and $\\det(A) = (4)(3) - (1)(2)$.',
      },
      {
        stepType: 'char_poly',
        badge: 'Form Characteristic Equation',
        prompt:
          'Use the $2\\times 2$ shortcut $\\det(A - \\lambda I) = \\lambda^2 - \\operatorname{tr}(A)\\lambda + \\det(A) = 0$.',
        highlightLatex:
          '\\lambda^2 - (\\textcolor{#22D3EE}{\\operatorname{tr} A})\\lambda + \\textcolor{#F59E0B}{\\det A} = 0',
        options: [
          {
            id: 'a',
            latex: '\\lambda^2 + 7\\lambda + 10 = 0',
            correct: false,
            misconception:
              'Watch the middle sign! Expanding $(4-\\lambda)(3-\\lambda) - 2$ gives $\\lambda^2 - 7\\lambda + 10 = 0$ (minus trace!).',
          },
          {
            id: 'b',
            latex: '\\lambda^2 - 7\\lambda - 10 = 0',
            correct: false,
            misconception:
              'The constant term is $+\\det(A) = +10$, not $-10$.',
          },
          {
            id: 'c',
            latex: '\\lambda^2 - 7\\lambda + 10 = 0',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\lambda^2 - 10\\lambda + 7 = 0',
            correct: false,
            misconception:
              'Trace multiplies $\\lambda$ and determinant is the constant term—don\'t swap $7$ and $10$!',
          },
        ],
        lockedLabel: 'Characteristic Eq',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\lambda^2 - 7\\lambda + 10 = 0}',
        hint: 'Substitute $\\operatorname{tr}(A) = 7$ and $\\det(A) = 10$ into $\\lambda^2 - (\\operatorname{tr} A)\\lambda + \\det A = 0$.',
      },
      {
        stepType: 'factor_eigenvalues',
        badge: 'Factor for Eigenvalues',
        prompt:
          'Factor $\\lambda^2 - 7\\lambda + 10 = 0$ to lock both eigenvalues (check $\\lambda_1 + \\lambda_2 = 7$, $\\lambda_1\\lambda_2 = 10$).',
        highlightLatex:
          '(\\lambda - \\textcolor{#22D3EE}{\\lambda_1})(\\lambda - \\textcolor{#F59E0B}{\\lambda_2}) = \\lambda^2 - 7\\lambda + 10 = 0',
        options: [
          {
            id: 'a',
            latex: '\\lambda_1 = -5, \\quad \\lambda_2 = -2',
            correct: false,
            misconception:
              'For $(\\lambda - 5)(\\lambda - 2) = 0$, the roots are $+5$ and $+2$; negative roots would sum to $-7 \\neq \\operatorname{tr}(A)$.',
          },
          {
            id: 'b',
            latex: '\\lambda_1 = 4, \\quad \\lambda_2 = 3',
            correct: false,
            misconception:
              'Diagonal entries are only eigenvalues when the matrix is triangular! Here $4\\times 3 = 12 \\neq \\det(A) = 10$.',
          },
          {
            id: 'c',
            latex: '\\lambda_1 = 10, \\quad \\lambda_2 = -3',
            correct: false,
            misconception:
              'Their sum is $7$, but their product is $-30 \\neq +10$. Find two numbers summing to $7$ and multiplying to $10$.',
          },
          {
            id: 'd',
            latex: '\\lambda_1 = 5, \\quad \\lambda_2 = 2',
            correct: true,
          },
        ],
        lockedLabel: 'Eigenvalues',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\lambda_1 = 5, \\quad \\lambda_2 = 2}',
        hint: 'What two positive integers add to $7$ and multiply to $10$?',
      },
    ],
  },

  {
    id: 'la3-eigenvectors-null',
    tier: 'eigen',
    tierLabel: 'Eigenvalues',
    title: 'Solving Null(A − λI) for Eigenvectors',
    mechatronicsContext:
      'Eigenvectors identify the decoupled modal axes of a coupled two-mass vibration system—exciting the plant strictly along $\\mathbf{v}_1$ or $\\mathbf{v}_2$ keeps motion pure along that single mode without cross-axis bleed.',
    expressionLatex:
      'A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix}, \\quad \\lambda_1 = 5,\\; \\lambda_2 = 2 \\implies \\text{find } \\mathbf{v}_1, \\mathbf{v}_2',
    finalAnswerLatex:
      '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}\\;(\\lambda_1 = 5), \\qquad \\mathbf{v}_2 = \\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix}\\;(\\lambda_2 = 2)',
    verifyPlot: {
      kind: 'eigen',
      A: [
        [4, 1],
        [2, 3],
      ],
      eigenpairs: [
        { lambda: 5, v: [1, 1], color: '#22D3EE', label: 'v₁ → 5v₁' },
        { lambda: 2, v: [1, -2], color: '#F59E0B', label: 'v₂ → 2v₂' },
      ],
      metrics: [
        { label: 'Av₁ = λ₁v₁', value: '[5, 5]ᵀ = 5[1, 1]ᵀ' },
        { label: 'Av₂ = λ₂v₂', value: '[2, -4]ᵀ = 2[1, -2]ᵀ' },
        { label: 'det(A-λI)', value: '0.0000' },
        { label: '‖Av - λv‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'shift_lambda1',
        badge: 'Form A − 5I',
        prompt:
          'Subtract $\\lambda_1 = 5$ ONLY from the main diagonal of $A$ to form $A - 5I$.',
        highlightLatex:
          'A - \\textcolor{#F59E0B}{5}I = \\begin{bmatrix} 4 - \\textcolor{#F59E0B}{5} & 1 \\\\ 2 & 3 - \\textcolor{#F59E0B}{5} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A - 5I = \\begin{bmatrix} -1 & -4 \\\\ -3 & -2 \\end{bmatrix}',
            correct: false,
            misconception:
              '$5I$ has zeros off the diagonal! Subtract $5$ ONLY from the main diagonal entries $4$ and $3$.',
          },
          {
            id: 'b',
            latex: 'A - 5I = \\begin{bmatrix} -1 & 1 \\\\ 2 & -2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A - 5I = \\begin{bmatrix} 1 & 1 \\\\ 2 & 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Compute $4 - 5 = -1$ and $3 - 5 = -2$; notice the rows of $A - 5I$ are proportional ($R_2 = -2R_1$), confirming $\\det(A-5I) = 0$.',
          },
          {
            id: 'd',
            latex: 'A - 5I = \\begin{bmatrix} -1 & 1 \\\\ 2 & 2 \\end{bmatrix}',
            correct: false,
            misconception:
              '$3 - 5 = -2$, not $+2$. A quick sanity check: every valid $A - \\lambda I$ MUST have determinant $0$!',
          },
        ],
        lockedLabel: 'A − 5I',
        lockedResultLatex:
          'A - 5I = \\textcolor{#22D3EE}{\\begin{bmatrix} -1 & 1 \\\\ 2 & -2 \\end{bmatrix}}',
        hint: 'Subtract $5$ from the diagonal entries ($4 - 5 = -1$, $3 - 5 = -2$) and leave $1, 2$ untouched.',
      },
      {
        stepType: 'nullspace_v1',
        badge: 'Solve Null(A − 5I) for v₁',
        prompt:
          'Find a nonzero vector $\\mathbf{v}_1$ satisfying $(A - 5I)\\mathbf{v}_1 = \\mathbf{0}$, i.e. $-x_1 + x_2 = 0$.',
        highlightLatex:
          '\\begin{bmatrix} -1 & 1 \\\\ 2 & -2 \\end{bmatrix}\\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ -1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Plug $[1, -1]^T$ into $-x_1 + x_2$: $-1 + (-1) = -2 \\neq 0$. Setting $-x_1 + x_2 = 0$ forces $x_2 = +x_1$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'By definition, an eigenvector MUST be nonzero ($\\mathbf{v} \\neq \\mathbf{0}$)—otherwise $A\\mathbf{0} = \\lambda\\mathbf{0}$ would hold for every scalar!',
          },
          {
            id: 'c',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check Row 1: $-1(1) + 1(2) = +1 \\neq 0$. Equal components ($x_1 = x_2 = 1$) give zero.',
          },
        ],
        lockedLabel: 'Eigenvector v₁',
        lockedResultLatex:
          '\\mathbf{v}_1 = \\textcolor{#34D399}{\\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}} \\;\\;(\\lambda_1 = 5)',
        hint: 'From $-x_1 + x_2 = 0$, pick free variable $x_1 = 1$ to get $x_2 = 1$.',
      },
      {
        stepType: 'nullspace_v2',
        badge: 'Solve Null(A − 2I) for v₂',
        prompt:
          'Form $A - 2I = \\begin{bmatrix} 2 & 1 \\\\ 2 & 1 \\end{bmatrix}$ and solve $(A - 2I)\\mathbf{v}_2 = \\mathbf{0}$ ($2x_1 + x_2 = 0$).',
        highlightLatex:
          '\\begin{bmatrix} 2 & 1 \\\\ 2 & 1 \\end{bmatrix}\\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{v}_2 = \\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is the row vector itself, which dots with $[2, 1]$ to $5 \\neq 0$! Swap the entries and negate one.',
          },
          {
            id: 'b',
            latex: '\\mathbf{v}_2 = \\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathbf{v}_2 = \\begin{bmatrix} -2 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $2(-2) + 1(1) = -3 \\neq 0$! From $2x_1 + x_2 = 0$, $x_2 = -2x_1$, so $x_1 = 1 \\implies x_2 = -2$.',
          },
          {
            id: 'd',
            latex: '\\mathbf{v}_2 = \\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $2(1) + 1(2) = 4 \\neq 0$; the two entries need opposite signs so they cancel.',
          },
        ],
        lockedLabel: 'Eigenvector v₂',
        lockedResultLatex:
          '\\mathbf{v}_2 = \\textcolor{#34D399}{\\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix}} \\;\\;(\\lambda_2 = 2)',
        hint: 'Solve $2x_1 + x_2 = 0 \\implies x_2 = -2x_1$, then set $x_1 = 1$.',
      },
      {
        stepType: 'verify_eigen_eq',
        badge: 'Verify Av = λv',
        prompt:
          'Multiply $A\\mathbf{v}_1$ and $A\\mathbf{v}_2$ directly to prove both vectors only scale without rotating.',
        highlightLatex:
          '\\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix}\\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}, \\qquad \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix}\\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A\\mathbf{v}_1 = \\begin{bmatrix} 5 \\\\ 5 \\end{bmatrix} = 5\\mathbf{v}_1, \\quad A\\mathbf{v}_2 = \\begin{bmatrix} 2 \\\\ -4 \\end{bmatrix} = 2\\mathbf{v}_2',
            correct: true,
          },
          {
            id: 'b',
            latex: 'A\\mathbf{v}_1 = \\begin{bmatrix} 5 \\\\ 5 \\end{bmatrix}, \\quad A\\mathbf{v}_2 = \\begin{bmatrix} 6 \\\\ -4 \\end{bmatrix}',
            correct: false,
            misconception:
              'In the top entry of $A\\mathbf{v}_2$, $4(1) + 1(-2) = 4 - 2 = 2$ (not $4 + 2 = 6$).',
          },
          {
            id: 'c',
            latex: 'A\\mathbf{v}_1 = \\begin{bmatrix} 2 \\\\ 2 \\end{bmatrix} = 2\\mathbf{v}_1, \\quad A\\mathbf{v}_2 = \\begin{bmatrix} 5 \\\\ -10 \\end{bmatrix} = 5\\mathbf{v}_2',
            correct: false,
            misconception:
              'The eigenvalues are swapped: $\\mathbf{v}_1 = [1, 1]^T$ scales by $5$ and $\\mathbf{v}_2 = [1, -2]^T$ scales by $2$.',
          },
          {
            id: 'd',
            latex: 'A\\mathbf{v}_1 = \\begin{bmatrix} 5 \\\\ 5 \\end{bmatrix}, \\quad A\\mathbf{v}_2 = \\begin{bmatrix} 2 \\\\ 4 \\end{bmatrix}',
            correct: false,
            misconception:
              'In the bottom entry of $A\\mathbf{v}_2$, $2(1) + 3(-2) = 2 - 6 = -4 = 2(-2)$.',
          },
        ],
        lockedLabel: 'Eigen Proof',
        lockedResultLatex:
          '\\textcolor{#34D399}{A\\mathbf{v}_1 = 5\\mathbf{v}_1, \\quad A\\mathbf{v}_2 = 2\\mathbf{v}_2}',
        hint: 'Check $[4+1,\\; 2+3]^T = 5[1,1]^T$ and $[4-2,\\; 2-6]^T = 2[1,-2]^T$.',
      },
    ],
  },

  {
    id: 'la3-diagonalize-power',
    tier: 'eigen',
    tierLabel: 'Eigenvalues',
    title: 'Diagonalization A = PDP⁻¹ & Matrix Power A³',
    mechatronicsContext:
      'In discrete-time digital control $\\mathbf{x}[k+1] = A\\mathbf{x}[k]$, diagonalizing $A = PDP^{-1}$ predicts state $\\mathbf{x}[k] = P D^k P^{-1}\\mathbf{x}[0]$ in $O(1)$ scalar powers instead of $k$ matrix multiplications.',
    expressionLatex:
      'A = \\begin{bmatrix} 2 & 0 \\\\ 1 & 3 \\end{bmatrix}, \\qquad \\text{diagonalize and compute } A^3',
    finalAnswerLatex:
      'A^3 = P D^3 P^{-1} = \\begin{bmatrix} 8 & 0 \\\\ 19 & 27 \\end{bmatrix}',
    verifyPlot: {
      kind: 'eigen',
      A: [
        [2, 0],
        [1, 3],
      ],
      eigenpairs: [
        { lambda: 2, v: [1, -1], color: '#22D3EE', label: 'v₁ (λ=2, λ³=8)' },
        { lambda: 3, v: [0, 1], color: '#F59E0B', label: 'v₂ (λ=3, λ³=27)' },
      ],
      metrics: [
        { label: 'D³ Diag', value: 'diag(8, 27)' },
        { label: 'det(P)', value: '1.0000' },
        { label: 'A³(2,1)', value: '27 - 8 = 19' },
        { label: '‖PD³P⁻¹ - A³‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'triangular_eigenpairs',
        badge: 'Find Eigenpairs of A',
        prompt:
          'Since $A$ is lower-triangular, read its diagonal eigenvalues $\\lambda_1 = 2, \\lambda_2 = 3$ and solve $(A - \\lambda I)\\mathbf{v} = \\mathbf{0}$.',
        highlightLatex:
          'A = \\begin{bmatrix} \\textcolor{#22D3EE}{2} & 0 \\\\ 1 & \\textcolor{#F59E0B}{3} \\end{bmatrix} \\implies A - 2I = \\begin{bmatrix} 0 & 0 \\\\ 1 & 1 \\end{bmatrix}, \\;\; A - 3I = \\begin{bmatrix} -1 & 0 \\\\ 1 & 0 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{v}_2 = \\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'For $\\lambda_1 = 2$, Row 2 of $A - 2I$ gives $x_1 + x_2 = 0$, so $x_2 = -x_1 \\implies \\mathbf{v}_1 = [1, -1]^T$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ -1 \\end{bmatrix}, \\quad \\mathbf{v}_2 = \\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}, \\quad \\mathbf{v}_2 = \\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              '$[1, 0]^T$ is NOT an eigenvector because $A[1, 0]^T = [2, 1]^T$, which is not a multiple of $[1, 0]^T$!',
          },
          {
            id: 'd',
            latex: '\\mathbf{v}_1 = \\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{v}_2 = \\begin{bmatrix} 1 \\\\ -1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Match each eigenvector to its own eigenvalue: $A[1, -1]^T = [2, -2]^T = 2\\mathbf{v}_1$ and $A[0, 1]^T = [0, 3]^T = 3\\mathbf{v}_2$.',
          },
        ],
        lockedLabel: 'Eigenpairs',
        lockedResultLatex:
          '\\lambda_1=2:\\;\\mathbf{v}_1=\\textcolor{#22D3EE}{\\begin{bmatrix} 1 \\\\ -1 \\end{bmatrix}}, \\quad \\lambda_2=3:\\;\\mathbf{v}_2=\\textcolor{#F59E0B}{\\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix}}',
        hint: 'From $A - 2I$: $x_1 + x_2 = 0$. From $A - 3I$: $x_1 = 0$ while $x_2$ is free.',
      },
      {
        stepType: 'assemble_p_inv',
        badge: 'Assemble P, D & Invert P',
        prompt:
          'Stack the eigenvectors as columns of $P = \\begin{bmatrix} 1 & 0 \\\\ -1 & 1 \\end{bmatrix}$ and compute $P^{-1}$.',
        highlightLatex:
          'P = \\begin{bmatrix} \\textcolor{#22D3EE}{1} & \\textcolor{#F59E0B}{0} \\\\ \\textcolor{#22D3EE}{-1} & \\textcolor{#F59E0B}{1} \\end{bmatrix}, \\qquad D = \\begin{bmatrix} \\textcolor{#22D3EE}{2} & 0 \\\\ 0 & \\textcolor{#F59E0B}{3} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'P^{-1} = \\begin{bmatrix} 1 & 0 \\\\ -1 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $P \\cdot P$: the $(2,1)$ entry becomes $-1 - 1 = -2 \\neq 0$! Negating the off-diagonal $-1$ gives $+1$.',
          },
          {
            id: 'b',
            latex: 'P^{-1} = \\begin{bmatrix} 1 & 1 \\\\ 0 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is the transpose of the inverse! Keep $0$ in the top-right and put $+1$ in the bottom-left.',
          },
          {
            id: 'c',
            latex: 'P^{-1} = \\begin{bmatrix} 1 & 0 \\\\ 1 & 1 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'P^{-1} = -\\begin{bmatrix} 1 & 0 \\\\ 1 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              '$\\det(P) = (1)(1) - (0)(-1) = +1$, so no outer minus sign is introduced.',
          },
        ],
        lockedLabel: 'Basis Inverse',
        lockedResultLatex:
          'P^{-1} = \\textcolor{#34D399}{\\begin{bmatrix} 1 & 0 \\\\ 1 & 1 \\end{bmatrix}} \\quad (\\det P = 1)',
        hint: 'With $\\det(P) = 1$, swap the diagonal ($1, 1$) and negate the off-diagonals ($0, -1 \\to 0, +1$).',
      },
      {
        stepType: 'power_diag',
        badge: 'Compute Diagonal Power D³',
        prompt:
          'Because $D$ is diagonal, raise each diagonal eigenvalue directly to the 3rd power.',
        highlightLatex:
          'D^3 = \\begin{bmatrix} \\textcolor{#22D3EE}{2} & 0 \\\\ 0 & \\textcolor{#F59E0B}{3} \\end{bmatrix}^3',
        options: [
          {
            id: 'a',
            latex: 'D^3 = \\begin{bmatrix} 6 & 0 \\\\ 0 & 9 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is $3D$ (multiplying by $3$), not $D^3$ (cubing)! Compute $2^3 = 8$ and $3^3 = 27$.',
          },
          {
            id: 'b',
            latex: 'D^3 = \\begin{bmatrix} 8 & 0 \\\\ 0 & 27 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'D^3 = \\begin{bmatrix} 8 & 1 \\\\ 0 & 27 \\end{bmatrix}',
            correct: false,
            misconception:
              'Any power of a diagonal matrix remains strictly diagonal—off-diagonal entries stay $0$.',
          },
          {
            id: 'd',
            latex: 'D^3 = \\begin{bmatrix} 27 & 0 \\\\ 0 & 8 \\end{bmatrix}',
            correct: false,
            misconception:
              'Keep the column order aligned with $P$: column 1 belongs to $\\lambda_1 = 2$ ($8$) and column 2 to $\\lambda_2 = 3$ ($27$).',
          },
        ],
        lockedLabel: 'Diagonal Cube',
        lockedResultLatex:
          'D^3 = \\textcolor{#34D399}{\\begin{bmatrix} 8 & 0 \\\\ 0 & 27 \\end{bmatrix}}',
        hint: 'Evaluate $2^3 = 8$ and $3^3 = 27$ on the diagonal.',
      },
      {
        stepType: 'reconstruct_a3',
        badge: 'Reconstruct A³ = P D³ P⁻¹',
        prompt:
          'Multiply $P D^3 P^{-1} = \\begin{bmatrix} 1 & 0 \\\\ -1 & 1 \\end{bmatrix}\\begin{bmatrix} 8 & 0 \\\\ 0 & 27 \\end{bmatrix}\\begin{bmatrix} 1 & 0 \\\\ 1 & 1 \\end{bmatrix}$.',
        highlightLatex:
          'A^3 = \\underbrace{\\begin{bmatrix} 8 & 0 \\\\ -8 & 27 \\end{bmatrix}}_{P D^3}\\begin{bmatrix} 1 & 0 \\\\ 1 & 1 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A^3 = \\begin{bmatrix} 8 & 0 \\\\ 1 & 27 \\end{bmatrix}',
            correct: false,
            misconception:
              'You cubed $A$ entrywise ($2^3, 0^3, 1^3, 3^3$)! Off-diagonal entries mix during matrix powers: $(-8)(1) + 27(1) = 19$.',
          },
          {
            id: 'b',
            latex: 'A^3 = \\begin{bmatrix} 8 & 0 \\\\ 35 & 27 \\end{bmatrix}',
            correct: false,
            misconception:
              'Watch the sign in $P D^3$: the $(2,1)$ entry is $-8$, so $(-8)(1) + 27(1) = 19$, not $+8 + 27 = 35$.',
          },
          {
            id: 'c',
            latex: 'A^3 = \\begin{bmatrix} 8 & 19 \\\\ 0 & 27 \\end{bmatrix}',
            correct: false,
            misconception:
              'Powers of a lower-triangular matrix stay lower-triangular! The $19$ belongs in position $(2, 1)$, not $(1, 2)$.',
          },
          {
            id: 'd',
            latex: 'A^3 = \\begin{bmatrix} 8 & 0 \\\\ 19 & 27 \\end{bmatrix}',
            correct: true,
          },
        ],
        lockedLabel: 'Matrix Power A³',
        lockedResultLatex:
          'A^3 = \\textcolor{#34D399}{\\begin{bmatrix} 8 & 0 \\\\ 19 & 27 \\end{bmatrix}}',
        hint: 'Row 2 of $P D^3$ is $[-8, 27]$; dot it with Column 1 of $P^{-1}$ ($[1, 1]^T$) to get $-8 + 27 = 19$.',
      },
    ],
  },

  {
    id: 'la3-complex-eigen',
    tier: 'eigen',
    tierLabel: 'Eigenvalues',
    title: 'Complex Eigenvalues of a Scaled Rotation',
    mechatronicsContext:
      'A skew-symmetric coupled oscillator or discrete spiral map $A = \\begin{bmatrix} a & -b \\\\ b & a \\end{bmatrix}$ has complex eigenvalues $a \\pm bi$ whose modulus $|\\lambda| = \\sqrt{a^2 + b^2}$ sets per-step amplitude growth and angle $\\phi = \\operatorname{atan2}(b, a)$ sets oscillation frequency.',
    expressionLatex:
      'A = \\begin{bmatrix} 1 & -2 \\\\ 2 & 1 \\end{bmatrix}, \\qquad \\text{find } \\lambda \\text{ and scaling } |\\lambda|',
    finalAnswerLatex:
      '\\lambda = 1 \\pm 2i, \\qquad |\\lambda| = \\sqrt{5}, \\qquad \\phi = \\arctan(2) \\approx 63.4^\\circ',
    verifyPlot: {
      kind: 'complex-rotation',
      A: [
        [1, -2],
        [2, 1],
      ],
      real: 1,
      imag: 2,
      modulus: Math.sqrt(5),
      angleDeg: (Math.atan2(2, 1) * 180) / Math.PI,
      metrics: [
        { label: 'Eigenvalues', value: '1 ± 2i' },
        { label: 'Scale |λ|', value: '2.2361 (√5)' },
        { label: 'Rotation φ', value: '63.43° (atan 2)' },
        { label: 'det = |λ|²', value: '5.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'complex_char_poly',
        badge: 'Characteristic Polynomial',
        prompt:
          'Compute $\\operatorname{tr}(A)$ and $\\det(A)$ to form $\\lambda^2 - (\\operatorname{tr} A)\\lambda + \\det(A) = 0$.',
        highlightLatex:
          'A = \\begin{bmatrix} \\textcolor{#22D3EE}{1} & \\textcolor{#F59E0B}{-2} \\\\ \\textcolor{#F59E0B}{2} & \\textcolor{#22D3EE}{1} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\lambda^2 - 2\\lambda - 3 = 0',
            correct: false,
            misconception:
              'Check $\\det(A) = (1)(1) - (-2)(2) = 1 - (-4) = +5$, NOT $1 - 4 = -3$!',
          },
          {
            id: 'b',
            latex: '\\lambda^2 - 2\\lambda + 5 = 0',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\lambda^2 + 2\\lambda + 5 = 0',
            correct: false,
            misconception:
              'Since $\\operatorname{tr}(A) = 1 + 1 = +2$, the middle term is $-\\operatorname{tr}(A)\\lambda = -2\\lambda$.',
          },
          {
            id: 'd',
            latex: '\\lambda^2 - 5\\lambda + 2 = 0',
            correct: false,
            misconception:
              'Trace ($2$) goes on the linear term and determinant ($5$) is the constant term.',
          },
        ],
        lockedLabel: 'Char Polynomial',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\lambda^2 - 2\\lambda + 5 = 0} \\quad (\\operatorname{tr}=2,\\;\\det=5)',
        hint: 'Be careful with double negatives in $\\det(A) = 1(1) - (-2)(2) = 1 + 4 = 5$.',
      },
      {
        stepType: 'complex_roots',
        badge: 'Solve Complex Conjugate Pair',
        prompt:
          'Apply the quadratic formula to $\\lambda^2 - 2\\lambda + 5 = 0$.',
        highlightLatex:
          '\\lambda = \\frac{2 \\pm \\sqrt{(-2)^2 - 4(1)(5)}}{2} = \\frac{2 \\pm \\sqrt{\\textcolor{#F59E0B}{-16}}}{2}',
        options: [
          {
            id: 'a',
            latex: '\\lambda = 1 \\pm 4i',
            correct: false,
            misconception:
              'Don\'t forget to divide $\\sqrt{-16} = 4i$ by the denominator $2$ as well: $\\frac{2 \\pm 4i}{2} = 1 \\pm 2i$.',
          },
          {
            id: 'b',
            latex: '\\lambda = 2 \\pm 2i',
            correct: false,
            misconception:
              'Divide BOTH the real part and imaginary part by $2$: $\\frac{2}{2} = 1$.',
          },
          {
            id: 'c',
            latex: '\\lambda = 1 \\pm 2i',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\lambda = -1 \\pm 2i',
            correct: false,
            misconception:
              'In $\\lambda = \\frac{-b \\pm \\sqrt{\\Delta}}{2}$, $-b = -(-2) = +2$, so the real part is $+1$.',
          },
        ],
        lockedLabel: 'Complex Roots',
        lockedResultLatex: '\\lambda = \\textcolor{#34D399}{1 \\pm 2i}',
        hint: 'Notice $\\sqrt{-16} = 4i$, then divide both $2$ and $4i$ by $2$.',
      },
      {
        stepType: 'complex_modulus',
        badge: 'Extract Radial Scaling |λ|',
        prompt:
          'Compute the geometric scaling factor $r = |\\lambda| = \\sqrt{\\alpha^2 + \\beta^2}$ for $\\lambda = 1 \\pm 2i$.',
        highlightLatex:
          '|\\lambda| = \\sqrt{\\textcolor{#22D3EE}{1}^2 + \\textcolor{#F59E0B}{2}^2}',
        options: [
          {
            id: 'a',
            latex: '|\\lambda| = 5',
            correct: false,
            misconception:
              '$5 = \\det(A) = |\\lambda|^2$ is the AREA scaling factor; the radial LENGTH scaling factor is $\\sqrt{5}$.',
          },
          {
            id: 'b',
            latex: '|\\lambda| = 3',
            correct: false,
            misconception:
              'Compute the Euclidean modulus $\\sqrt{1^2 + 2^2} = \\sqrt{5}$, not $|1| + |2| = 3$.',
          },
          {
            id: 'c',
            latex: '|\\lambda| = \\sqrt{3}',
            correct: false,
            misconception:
              'Modulus squares the imaginary coefficient WITH a plus sign ($1^2 + 2^2 = 5$), never $1^2 + (2i)^2$.',
          },
          {
            id: 'd',
            latex: '|\\lambda| = \\sqrt{5} \\approx 2.236 \\;\\;(\\text{spiral expansion})',
            correct: true,
          },
        ],
        lockedLabel: 'Scaling Modulus',
        lockedResultLatex:
          '|\\lambda| = \\textcolor{#34D399}{\\sqrt{5}} \\quad (\\phi = \\arctan 2 \\approx 63.4^\\circ)',
        hint: 'Every vector in $\\mathbb{R}^2$ rotates by $\\phi = \\arctan(2/1)$ and stretches by $\\sqrt{1^2 + 2^2}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: ORTHOGONALITY & LEAST SQUARES (2 problems)
  // =========================================================================
  {
    id: 'la4-gram-schmidt',
    tier: 'orthogonality',
    tierLabel: 'Orthogonal',
    title: 'Gram-Schmidt Orthonormalization',
    mechatronicsContext:
      'When IMU sensor drift causes a drone\'s 3D rotation matrix $R$ to lose orthogonality, Gram-Schmidt re-orthonormalizes its columns back to $Q^T Q = I$ so attitude estimates never skew or stretch.',
    expressionLatex:
      '\\mathbf{a}_1 = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}, \\quad \\mathbf{a}_2 = \\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix} \\implies \\text{find orthonormal } \\{\\mathbf{q}_1, \\mathbf{q}_2\\}',
    finalAnswerLatex:
      '\\mathbf{q}_1 = \\begin{bmatrix} 3/5 \\\\ 4/5 \\end{bmatrix}, \\qquad \\mathbf{q}_2 = \\begin{bmatrix} 4/5 \\\\ -3/5 \\end{bmatrix} \\qquad (Q^T Q = I)',
    verifyPlot: {
      kind: 'gram-schmidt',
      a1: [3, 4],
      a2: [1, 0],
      q1: [0.6, 0.8],
      q2: [0.8, -0.6],
      metrics: [
        { label: '‖q₁‖, ‖q₂‖', value: '1.000, 1.000' },
        { label: 'q₁ · q₂', value: '0.0000 ⊥' },
        { label: 'Angle', value: '90.00°' },
        { label: '‖QᵀQ - I‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'gs_normalize_1',
        badge: 'Normalize First Vector q₁',
        prompt:
          'Divide $\\mathbf{a}_1 = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}$ by its norm $\\|\\mathbf{a}_1\\| = \\sqrt{3^2 + 4^2} = 5$.',
        highlightLatex:
          '\\mathbf{q}_1 = \\frac{\\textcolor{#22D3EE}{\\mathbf{a}_1}}{\\|\\textcolor{#22D3EE}{\\mathbf{a}_1}\\|} = \\frac{1}{5}\\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{q}_1 = \\begin{bmatrix} 3/7 \\\\ 4/7 \\end{bmatrix}',
            correct: false,
            misconception:
              'Normalize by the Euclidean length $\\sqrt{3^2 + 4^2} = 5$, not the sum $3 + 4 = 7$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{q}_1 = \\begin{bmatrix} 3/5 \\\\ 4/5 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathbf{q}_1 = \\begin{bmatrix} 3/25 \\\\ 4/25 \\end{bmatrix}',
            correct: false,
            misconception:
              'Divide by $\\|\\mathbf{a}_1\\| = 5$, not $\\|\\mathbf{a}_1\\|^2 = 25$; check $\\|\\mathbf{q}_1\\| = \\sqrt{9/25 + 16/25} = 1$.',
          },
          {
            id: 'd',
            latex: '\\mathbf{q}_1 = \\begin{bmatrix} 4/5 \\\\ 3/5 \\end{bmatrix}',
            correct: false,
            misconception:
              'Keep $\\mathbf{q}_1$ parallel to $\\mathbf{a}_1 = [3, 4]^T$ without swapping coordinates.',
          },
        ],
        lockedLabel: 'Unit Vector q₁',
        lockedResultLatex:
          '\\mathbf{q}_1 = \\textcolor{#22D3EE}{\\begin{bmatrix} 3/5 \\\\ 4/5 \\end{bmatrix}} \\quad (\\|\\mathbf{q}_1\\| = 1)',
        hint: '3-4-5 right triangle! Divide both entries of $[3, 4]^T$ by $5$.',
      },
      {
        stepType: 'gs_dot_component',
        badge: 'Find Projection Scalar q₁ · a₂',
        prompt:
          'Compute the component of $\\mathbf{a}_2 = \\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}$ along the unit vector $\\mathbf{q}_1$.',
        highlightLatex:
          'r_{12} = \\textcolor{#22D3EE}{\\mathbf{q}_1}\\cdot\\textcolor{#F59E0B}{\\mathbf{a}_2} = \\begin{bmatrix} 3/5 \\\\ 4/5 \\end{bmatrix}\\cdot\\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{q}_1\\cdot\\mathbf{a}_2 = \\frac{3}{5}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathbf{q}_1\\cdot\\mathbf{a}_2 = \\frac{4}{5}',
            correct: false,
            misconception:
              'Dotting with $[1, 0]^T$ extracts the FIRST entry of $\\mathbf{q}_1$, which is $\\frac{3}{5}$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{q}_1\\cdot\\mathbf{a}_2 = 3',
            correct: false,
            misconception:
              'Use the normalized unit vector $\\mathbf{q}_1 = [3/5, 4/5]^T$, not the raw $\\mathbf{a}_1 = [3, 4]^T$.',
          },
          {
            id: 'd',
            latex: '\\mathbf{q}_1\\cdot\\mathbf{a}_2 = \\frac{7}{5}',
            correct: false,
            misconception:
              'The second term is $(4/5)(0) = 0$, leaving only $\\frac{3}{5}$.',
          },
        ],
        lockedLabel: 'Overlap r₁₂',
        lockedResultLatex:
          '\\mathbf{q}_1\\cdot\\mathbf{a}_2 = \\textcolor{#F59E0B}{\\frac{3}{5}}',
        hint: 'Compute $(3/5)(1) + (4/5)(0)$.',
      },
      {
        stepType: 'gs_orthogonalize',
        badge: 'Subtract Projection u₂',
        prompt:
          'Subtract the parallel component $(\\mathbf{q}_1\\cdot\\mathbf{a}_2)\\mathbf{q}_1$ from $\\mathbf{a}_2$ to create an orthogonal vector $\\mathbf{u}_2 \\perp \\mathbf{q}_1$.',
        highlightLatex:
          '\\mathbf{u}_2 = \\textcolor{#F59E0B}{\\begin{bmatrix} 1 \\\\ 0 \\end{bmatrix}} - \\textcolor{#F59E0B}{\\frac{3}{5}}\\textcolor{#22D3EE}{\\begin{bmatrix} 3/5 \\\\ 4/5 \\end{bmatrix}} = \\begin{bmatrix} 1 - 9/25 \\\\ 0 - 12/25 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{u}_2 = \\begin{bmatrix} 16/25 \\\\ 12/25 \\end{bmatrix}',
            correct: false,
            misconception:
              'Watch the sign on the second entry: $0 - \\frac{12}{25} = -\\frac{12}{25}$, not $+\\frac{12}{25}$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{u}_2 = \\begin{bmatrix} 2/5 \\\\ -4/5 \\end{bmatrix}',
            correct: false,
            misconception:
              'Multiply $\\mathbf{q}_1$ by the scalar $\\frac{3}{5}$ before subtracting! $(3/5)[3/5, 4/5]^T = [9/25, 12/25]^T$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{u}_2 = \\begin{bmatrix} 16/25 \\\\ -12/25 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathbf{u}_2 = \\begin{bmatrix} 9/25 \\\\ 12/25 \\end{bmatrix}',
            correct: false,
            misconception:
              '$[9/25, 12/25]^T$ is the projection ONTO $\\mathbf{q}_1$; you must SUBTRACT it from $\\mathbf{a}_2 = [1, 0]^T$.',
          },
        ],
        lockedLabel: 'Orthogonal u₂',
        lockedResultLatex:
          '\\mathbf{u}_2 = \\textcolor{#34D399}{\\begin{bmatrix} 16/25 \\\\ -12/25 \\end{bmatrix}} = \\frac{4}{25}\\begin{bmatrix} 4 \\\\ -3 \\end{bmatrix}',
        hint: 'Write $1 = \\frac{25}{25}$ so $1 - \\frac{9}{25} = \\frac{16}{25}$ and $0 - \\frac{12}{25} = -\\frac{12}{25}$.',
      },
      {
        stepType: 'gs_normalize_2',
        badge: 'Normalize u₂ to Unit q₂',
        prompt:
          'Normalize $\\mathbf{u}_2 = \\frac{4}{25}\\begin{bmatrix} 4 \\\\ -3 \\end{bmatrix}$ (whose norm is $\\|\\mathbf{u}_2\\| = \\frac{4}{25}\\cdot 5 = \\frac{4}{5}$) to obtain $\\mathbf{q}_2$.',
        highlightLatex:
          '\\mathbf{q}_2 = \\frac{\\mathbf{u}_2}{\\|\\mathbf{u}_2\\|} = \\frac{1}{4/5}\\cdot\\frac{4}{25}\\begin{bmatrix} 4 \\\\ -3 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{q}_2 = \\begin{bmatrix} 4/5 \\\\ 3/5 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $\\mathbf{q}_1\\cdot\\mathbf{q}_2 = \\frac{12}{25} + \\frac{12}{25} = \\frac{24}{25} \\neq 0$! Preserve the minus sign on $-3/5$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{q}_2 = \\begin{bmatrix} 4/25 \\\\ -3/25 \\end{bmatrix}',
            correct: false,
            misconception:
              'That vector has length $\\frac{1}{5} \\neq 1$; dividing by $\\|\\mathbf{u}_2\\| = \\frac{4}{5}$ multiplies by $\\frac{5}{4}$, yielding $[4/5, -3/5]^T$.',
          },
          {
            id: 'c',
            latex: '\\mathbf{q}_2 = \\begin{bmatrix} -4/5 \\\\ 3/5 \\end{bmatrix}',
            correct: false,
            misconception:
              'While orthogonal to $\\mathbf{q}_1$, standard Gram-Schmidt keeps the positive direction of $\\mathbf{u}_2$ so $r_{22} = \\mathbf{q}_2\\cdot\\mathbf{a}_2 = +4/5 > 0$.',
          },
          {
            id: 'd',
            latex: '\\mathbf{q}_2 = \\begin{bmatrix} 4/5 \\\\ -3/5 \\end{bmatrix}',
            correct: true,
          },
        ],
        lockedLabel: 'Orthonormal q₂',
        lockedResultLatex:
          '\\mathbf{q}_2 = \\textcolor{#34D399}{\\begin{bmatrix} 4/5 \\\\ -3/5 \\end{bmatrix}} \\quad (\\mathbf{q}_1\\cdot\\mathbf{q}_2 = 0)',
        hint: 'Factor out $\\frac{4}{25}$: normalizing $[4, -3]^T$ (another 3-4-5 triangle!) immediately yields $[4/5, -3/5]^T$.',
      },
    ],
  },

  {
    id: 'la4-least-squares',
    tier: 'orthogonality',
    tierLabel: 'Orthogonal',
    title: 'Least-Squares Sensor Calibration',
    mechatronicsContext:
      'Calibrating a noisy load cell from overdetermined test weights $(t_i, b_i)$ solves the normal equations $A^T A\\hat{\\mathbf{x}} = A^T\\mathbf{b}$ to lock the optimal offset $\\hat{c}$ and gain $\\hat{m}$ with orthogonal residual $\\mathbf{e} \\perp \\operatorname{Col}(A)$.',
    expressionLatex:
      '\\text{Fit } \\hat{y} = c + m t \\text{ to } (-1, 1),\\; (0, 1),\\; (1, 4)',
    finalAnswerLatex:
      '\\hat{\\mathbf{x}} = \\begin{bmatrix} \\hat{c} \\\\ \\hat{m} \\end{bmatrix} = \\begin{bmatrix} 2 \\\\ 3/2 \\end{bmatrix} \\implies \\hat{y}(t) = 2 + 1.5t',
    verifyPlot: {
      kind: 'least-squares',
      points: [
        [-1, 1],
        [0, 1],
        [1, 4],
      ],
      intercept: 2,
      slope: 1.5,
      metrics: [
        { label: 'Best Fit ŷ(t)', value: '2 + 1.5t' },
        { label: 'Residuals e', value: '[+0.5, -1, +0.5]ᵀ' },
        { label: 'Min ‖e‖²', value: '1.5000' },
        { label: 'Aᵀe Check', value: '[0, 0]ᵀ ⊥ ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ls_design_matrix',
        badge: 'Build Design Matrix A & b',
        prompt:
          'Stack the three model equations $c + m t_i \\approx b_i$ for $(-1, 1), (0, 1), (1, 4)$ into $A\\mathbf{x} \\approx \\mathbf{b}$.',
        highlightLatex:
          '\\begin{cases} 1\\cdot c + (-1)\\cdot m \\approx 1 \\\\ 1\\cdot c + (0)\\cdot m \\approx 1 \\\\ 1\\cdot c + (1)\\cdot m \\approx 4 \\end{cases}',
        options: [
          {
            id: 'a',
            latex: 'A = \\begin{bmatrix} 1 & -1 \\\\ 1 & 0 \\\\ 1 & 1 \\end{bmatrix}, \\quad \\mathbf{b} = \\begin{bmatrix} 1 \\\\ 1 \\\\ 4 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'A = \\begin{bmatrix} -1 & 1 \\\\ 0 & 1 \\\\ 1 & 4 \\end{bmatrix}, \\quad \\mathbf{b} = \\begin{bmatrix} 1 \\\\ 1 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'The observed outputs $(1, 1, 4)$ go in $\\mathbf{b}$, while the constant intercept column $[1, 1, 1]^T$ goes in $A$!',
          },
          {
            id: 'c',
            latex: 'A = \\begin{bmatrix} 1 & 1 & 1 \\\\ -1 & 0 & 1 \\end{bmatrix}, \\quad \\mathbf{b} = \\begin{bmatrix} 1 \\\\ 1 \\\\ 4 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is $A^T$ ($2\\times 3$), which cannot multiply a $2\\times 1$ parameter vector $\\mathbf{x} = [c, m]^T$. $A$ must be $3\\times 2$.',
          },
          {
            id: 'd',
            latex: 'A = \\begin{bmatrix} 1 & -1 \\\\ 0 & 0 \\\\ 1 & 1 \\end{bmatrix}, \\quad \\mathbf{b} = \\begin{bmatrix} 1 \\\\ 1 \\\\ 4 \\end{bmatrix}',
            correct: false,
            misconception:
              'Even when $t_2 = 0$, the intercept $c$ still has coefficient $1$ in row 2!',
          },
        ],
        lockedLabel: 'Design System',
        lockedResultLatex:
          'A = \\textcolor{#22D3EE}{\\begin{bmatrix} 1 & -1 \\\\ 1 & 0 \\\\ 1 & 1 \\end{bmatrix}}, \\quad \\mathbf{b} = \\textcolor{#F59E0B}{\\begin{bmatrix} 1 \\\\ 1 \\\\ 4 \\end{bmatrix}}',
        hint: 'Each row is $[1,\\; t_i]$ multiplying $[c, m]^T$, and $\\mathbf{b}$ holds the three $y$-readings.',
      },
      {
        stepType: 'ls_gram_matrix',
        badge: 'Compute Gram Matrix AᵀA',
        prompt:
          'Multiply $A^T A$ to compress the overdetermined $3\\times 2$ design matrix into a symmetric $2\\times 2$ matrix.',
        highlightLatex:
          '\\textcolor{#22D3EE}{A^T A} = \\begin{bmatrix} 1 & 1 & 1 \\\\ -1 & 0 & 1 \\end{bmatrix}\\begin{bmatrix} 1 & -1 \\\\ 1 & 0 \\\\ 1 & 1 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A^T A = \\begin{bmatrix} 3 & 0 \\\\ 0 & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $(-1)^2 + 0^2 + 1^2 = 1 + 0 + 1 = 2$, not $-1 + 0 + 1 = 0$!',
          },
          {
            id: 'b',
            latex: 'A^T A = \\begin{bmatrix} 3 & 2 \\\\ 2 & 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Because the $t$-values $(-1, 0, 1)$ are centered symmetrically around $0$, their sum is $-1 + 0 + 1 = 0$—making $A^T A$ cleanly diagonal!',
          },
          {
            id: 'c',
            latex: 'A^T A = \\begin{bmatrix} 3 & 0 \\\\ 0 & 2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'A^T A = \\begin{bmatrix} 2 & 0 \\\\ 0 & 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'The $(1,1)$ entry is $\\|[1,1,1]\\|^2 = 3$ and the $(2,2)$ entry is $\\|[-1,0,1]\\|^2 = 2$.',
          },
        ],
        lockedLabel: 'Gram Matrix AᵀA',
        lockedResultLatex:
          'A^T A = \\textcolor{#34D399}{\\begin{bmatrix} 3 & 0 \\\\ 0 & 2 \\end{bmatrix}}',
        hint: 'Notice the two columns of $A$ are orthogonal ($-1 + 0 + 1 = 0$), so off-diagonals vanish!',
      },
      {
        stepType: 'ls_rhs',
        badge: 'Compute Right-Hand Side Aᵀb',
        prompt:
          'Project the observation vector $\\mathbf{b}$ onto the columns of $A$ by computing $A^T\\mathbf{b}$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{A^T\\mathbf{b}} = \\begin{bmatrix} 1 & 1 & 1 \\\\ -1 & 0 & 1 \\end{bmatrix}\\begin{bmatrix} 1 \\\\ 1 \\\\ 4 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A^T\\mathbf{b} = \\begin{bmatrix} 6 \\\\ 5 \\end{bmatrix}',
            correct: false,
            misconception:
              'Watch the minus sign on $-1$ in Row 2: $(-1)(1) + 0(1) + (1)(4) = -1 + 4 = 3$, not $1 + 4 = 5$.',
          },
          {
            id: 'b',
            latex: 'A^T\\mathbf{b} = \\begin{bmatrix} 6 \\\\ 3 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A^T\\mathbf{b} = \\begin{bmatrix} 5 \\\\ 3 \\end{bmatrix}',
            correct: false,
            misconception:
              'Sum all three observations in Row 1: $1 + 1 + 4 = 6$, not $5$.',
          },
          {
            id: 'd',
            latex: 'A^T\\mathbf{b} = \\begin{bmatrix} 3 \\\\ 6 \\end{bmatrix}',
            correct: false,
            misconception:
              'Row 1 sums the $b_i$ ($6$) and Row 2 weights them by $t_i$ ($3$); keep that order.',
          },
        ],
        lockedLabel: 'Normal RHS',
        lockedResultLatex:
          'A^T\\mathbf{b} = \\textcolor{#F59E0B}{\\begin{bmatrix} 6 \\\\ 3 \\end{bmatrix}}',
        hint: 'Top entry: $1 + 1 + 4$; bottom entry: $-1(1) + 0(1) + 1(4)$.',
      },
      {
        stepType: 'ls_solve',
        badge: 'Solve Normal Equations',
        prompt:
          'Solve $\\begin{bmatrix} 3 & 0 \\\\ 0 & 2 \\end{bmatrix}\\begin{bmatrix} \\hat{c} \\\\ \\hat{m} \\end{bmatrix} = \\begin{bmatrix} 6 \\\\ 3 \\end{bmatrix}$ for the best-fit line $\\hat{y}(t) = \\hat{c} + \\hat{m}t$.',
        highlightLatex:
          '\\textcolor{#34D399}{3}\\,\\hat{c} = 6, \\qquad \\textcolor{#34D399}{2}\\,\\hat{m} = 3',
        options: [
          {
            id: 'a',
            latex: '\\hat{y}(t) = \\frac{3}{2} + 2t',
            correct: false,
            misconception:
              'You swapped intercept and slope! $\\hat{c} = 6/3 = 2$ is the intercept and $\\hat{m} = 3/2 = 1.5$ is the slope.',
          },
          {
            id: 'b',
            latex: '\\hat{y}(t) = 2 + 3t',
            correct: false,
            misconception:
              'Divide $3$ by the diagonal entry $2$ in $2\\hat{m} = 3$ to get $\\hat{m} = \\frac{3}{2} = 1.5$.',
          },
          {
            id: 'c',
            latex: '\\hat{y}(t) = 1 + \\frac{3}{2}t',
            correct: false,
            misconception:
              'The mean of the three $y$-readings $(1, 1, 4)$ is $\\frac{6}{3} = 2$, so the intercept is $\\hat{c} = 2$.',
          },
          {
            id: 'd',
            latex: '\\hat{y}(t) = 2 + \\frac{3}{2}t',
            correct: true,
          },
        ],
        lockedLabel: 'Best-Fit Line',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\hat{y}(t) = 2 + 1.5t} \\quad (A^T\\mathbf{e} = \\mathbf{0})',
        hint: 'Because $A^T A$ is diagonal, divide each RHS entry directly by its diagonal pivot: $6/3$ and $3/2$.',
      },
    ],
  },

  // =========================================================================
  // TIER 5: SVD & SYMMETRIC POSITIVE-DEFINITE MATRICES (2 problems)
  // =========================================================================
  {
    id: 'la5-svd-singular',
    tier: 'svd-decomp',
    tierLabel: 'SVD & SPD',
    title: 'Singular Values & Condition Number κ(A)',
    mechatronicsContext:
      'The singular values $\\sigma_1, \\sigma_2$ of a robot Jacobian $J$ define the major and minor radii of its manipulability ellipse; a small condition number $\\kappa(J) = \\sigma_1 / \\sigma_2$ ensures uniform dexterity and low noise amplification.',
    expressionLatex:
      'A = \\begin{bmatrix} 3 & 1 \\\\ 1 & 3 \\end{bmatrix}, \\qquad \\text{find } \\sigma_1, \\sigma_2 \\text{ and } \\kappa(A)',
    finalAnswerLatex:
      '\\sigma_1 = 4, \\quad \\sigma_2 = 2, \\qquad \\kappa(A) = \\frac{\\sigma_1}{\\sigma_2} = 2',
    verifyPlot: {
      kind: 'svd',
      A: [
        [3, 1],
        [1, 3],
      ],
      sigma1: 4,
      sigma2: 2,
      u1: [Math.SQRT1_2, Math.SQRT1_2],
      u2: [-Math.SQRT1_2, Math.SQRT1_2],
      metrics: [
        { label: 'σ₁ Max Gain', value: '4.0000' },
        { label: 'σ₂ Min Gain', value: '2.0000' },
        { label: 'Cond κ(A)', value: '2.0000 (Healthy)' },
        { label: 'σ₁σ₂ = |det|', value: '8.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'svd_ata',
        badge: 'Compute Gram Matrix AᵀA',
        prompt:
          'Form the symmetric positive-semidefinite matrix $A^T A$ whose eigenvalues are the squared singular values $\\sigma_i^2$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{A^T A} = \\begin{bmatrix} 3 & 1 \\\\ 1 & 3 \\end{bmatrix}\\begin{bmatrix} 3 & 1 \\\\ 1 & 3 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A^T A = \\begin{bmatrix} 9 & 1 \\\\ 1 & 9 \\end{bmatrix}',
            correct: false,
            misconception:
              'Never square a matrix entrywise! Row 1 dotted with Column 1 is $3^2 + 1^2 = 10$, and Row 1 dotted with Column 2 is $3(1) + 1(3) = 6$.',
          },
          {
            id: 'b',
            latex: 'A^T A = \\begin{bmatrix} 10 & 6 \\\\ 6 & 10 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A^T A = \\begin{bmatrix} 10 & 3 \\\\ 3 & 10 \\end{bmatrix}',
            correct: false,
            misconception:
              'The off-diagonal entry is $3(1) + 1(3) = 3 + 3 = 6$, not $3$.',
          },
          {
            id: 'd',
            latex: 'A^T A = \\begin{bmatrix} 6 & 2 \\\\ 2 & 6 \\end{bmatrix}',
            correct: false,
            misconception:
              'That is $2A$, not $A^T A$; multiply rows of $A^T$ by columns of $A$.',
          },
        ],
        lockedLabel: 'Gram Matrix AᵀA',
        lockedResultLatex:
          'A^T A = \\textcolor{#22D3EE}{\\begin{bmatrix} 10 & 6 \\\\ 6 & 10 \\end{bmatrix}}',
        hint: 'Diagonal entries: $3^2 + 1^2 = 10$; off-diagonal entries: $3(1) + 1(3) = 6$.',
      },
      {
        stepType: 'svd_ata_eigs',
        badge: 'Find Eigenvalues of AᵀA',
        prompt:
          'Find the eigenvalues $\\lambda_1, \\lambda_2$ of $A^T A = \\begin{bmatrix} 10 & 6 \\\\ 6 & 10 \\end{bmatrix}$ ($\\operatorname{tr} = 20$, $\\det = 64$).',
        highlightLatex:
          '\\lambda^2 - \\textcolor{#22D3EE}{20}\\lambda + \\textcolor{#F59E0B}{64} = 0',
        options: [
          {
            id: 'a',
            latex: '\\lambda_1 = 16, \\quad \\lambda_2 = 4',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\lambda_1 = 10, \\quad \\lambda_2 = 6',
            correct: false,
            misconception:
              'For a symmetric $\\begin{bmatrix} a & b \\\\ b & a \\end{bmatrix}$ matrix, eigenvalues are $a + b = 16$ and $a - b = 4$, not $a$ and $b$!',
          },
          {
            id: 'c',
            latex: '\\lambda_1 = 16, \\quad \\lambda_2 = -4',
            correct: false,
            misconception:
              '$A^T A$ is positive-semidefinite, so its eigenvalues can NEVER be negative! Also $16 \\times 4 = +64 = \\det(A^T A)$.',
          },
          {
            id: 'd',
            latex: '\\lambda_1 = 8, \\quad \\lambda_2 = 8',
            correct: false,
            misconception:
              '$8 + 8 = 16 \\neq \\operatorname{tr}(A^T A) = 20$. Check $(16)(4) = 64$ and $16 + 4 = 20$.',
          },
        ],
        lockedLabel: 'Eigenvalues(AᵀA)',
        lockedResultLatex:
          '\\lambda_1(A^T A) = \\textcolor{#34D399}{16}, \\quad \\lambda_2(A^T A) = \\textcolor{#34D399}{4}',
        hint: 'Factor $(\\lambda - 16)(\\lambda - 4) = 0$ (or use the shortcut $10 \\pm 6$ for symmetric Toeplitz $2\\times 2$ matrices).',
      },
      {
        stepType: 'svd_singular_vals',
        badge: 'Take Square Roots for σᵢ',
        prompt:
          'Compute the singular values $\\sigma_i = \\sqrt{\\lambda_i(A^T A)}$ ordered $\\sigma_1 \\ge \\sigma_2 \\ge 0$.',
        highlightLatex:
          '\\sigma_1 = \\sqrt{\\textcolor{#34D399}{16}}, \\qquad \\sigma_2 = \\sqrt{\\textcolor{#34D399}{4}}',
        options: [
          {
            id: 'a',
            latex: '\\sigma_1 = 16, \\quad \\sigma_2 = 4',
            correct: false,
            misconception:
              'Remember to take square roots! $16$ and $4$ are $\\sigma_i^2$, so $\\sigma_1 = 4$ and $\\sigma_2 = 2$.',
          },
          {
            id: 'b',
            latex: '\\sigma_1 = 4, \\quad \\sigma_2 = 2',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\sigma_1 = \\pm 4, \\quad \\sigma_2 = \\pm 2',
            correct: false,
            misconception:
              'Singular values are geometric ellipse radii and are ALWAYS non-negative ($\\sigma_i \\ge 0$).',
          },
          {
            id: 'd',
            latex: '\\sigma_1 = 8, \\quad \\sigma_2 = 2',
            correct: false,
            misconception:
              '$\\sqrt{16} = 4$, not $8$ (and check $\\sigma_1\\sigma_2 = 4\\cdot 2 = 8 = |\\det(A)|$).',
          },
        ],
        lockedLabel: 'Singular Values',
        lockedResultLatex:
          '\\sigma_1 = \\textcolor{#34D399}{4}, \\quad \\sigma_2 = \\textcolor{#34D399}{2} \\quad (\\sigma_1\\sigma_2 = |\\det A| = 8)',
        hint: 'Take the positive square roots of $16$ and $4$.',
      },
      {
        stepType: 'svd_cond_num',
        badge: 'Compute Condition Number κ(A)',
        prompt:
          'Compute the 2-norm condition number $\\kappa(A) = \\frac{\\sigma_{\\max}}{\\sigma_{\\min}} = \\frac{\\sigma_1}{\\sigma_2}$.',
        highlightLatex:
          '\\kappa(A) = \\frac{\\textcolor{#22D3EE}{\\sigma_1}}{\\textcolor{#F59E0B}{\\sigma_2}} = \\frac{4}{2}',
        options: [
          {
            id: 'a',
            latex: '\\kappa(A) = 4',
            correct: false,
            misconception:
              '$4$ is $\\frac{\\lambda_1}{\\lambda_2} = \\kappa(A)^2$ (the ratio of SQUARED singular values). Use $\\frac{\\sigma_1}{\\sigma_2} = \\frac{4}{2} = 2$.',
          },
          {
            id: 'b',
            latex: '\\kappa(A) = \\frac{1}{2}',
            correct: false,
            misconception:
              'Put the LARGEST singular value on top: $\\kappa(A) = \\sigma_1 / \\sigma_2 \\ge 1$ always!',
          },
          {
            id: 'c',
            latex: '\\kappa(A) = 8',
            correct: false,
            misconception:
              '$\\sigma_1 \\sigma_2 = 8$ is the determinant area factor, whereas $\\kappa(A)$ is the aspect RATIO $\\sigma_1 / \\sigma_2$.',
          },
          {
            id: 'd',
            latex: '\\kappa(A) = 2',
            correct: true,
          },
        ],
        lockedLabel: 'Condition Number',
        lockedResultLatex:
          '\\kappa(A) = \\frac{4}{2} = \\textcolor{#34D399}{2} \\;\\;(\\text{well-conditioned})',
        hint: 'Divide the largest singular value ($4$) by the smallest ($2$).',
      },
    ],
  },

  {
    id: 'la5-spd-spectral',
    tier: 'svd-decomp',
    tierLabel: 'SVD & SPD',
    title: 'SPD Test & Spectral Decomposition QΛQᵀ',
    mechatronicsContext:
      'In LQR optimal control and Kalman filtering, a symmetric positive-definite (SPD) quadratic cost or covariance matrix $P = Q\\Lambda Q^T$ defines a strictly convex energy bowl ($\\mathbf{x}^T P\\mathbf{x} > 0$) with orthogonal principal uncertainty axes.',
    expressionLatex:
      'A = \\begin{bmatrix} 5 & 2 \\\\ 2 & 2 \\end{bmatrix}, \\qquad \\text{verify SPD and find } A = Q\\Lambda Q^T',
    finalAnswerLatex:
      'A = Q\\Lambda Q^T, \\quad Q = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 & -1 \\\\ 1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 6 & 0 \\\\ 0 & 1 \\end{bmatrix}',
    verifyPlot: {
      kind: 'svd',
      isSpd: true,
      A: [
        [5, 2],
        [2, 2],
      ],
      sigma1: 6,
      sigma2: 1,
      u1: [2 / Math.sqrt(5), 1 / Math.sqrt(5)],
      u2: [-1 / Math.sqrt(5), 2 / Math.sqrt(5)],
      metrics: [
        { label: 'Minors Δ₁, Δ₂', value: '5 > 0, 6 > 0 (SPD)' },
        { label: 'Eigenvalues', value: 'λ₁ = 6, λ₂ = 1' },
        { label: 'q₁ · q₂', value: '0.0000 ⊥' },
        { label: '‖QΛQᵀ - A‖', value: '0.0000 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'spd_sylvester',
        badge: "Sylvester's SPD Test",
        prompt:
          'Check symmetry ($A = A^T$) and both leading principal minors $\\Delta_1 = a_{11}$ and $\\Delta_2 = \\det(A)$.',
        highlightLatex:
          'A = \\begin{bmatrix} \\textcolor{#22D3EE}{5} & \\textcolor{#F59E0B}{2} \\\\ \\textcolor{#F59E0B}{2} & \\textcolor{#22D3EE}{2} \\end{bmatrix}, \\qquad \\Delta_1 = 5, \\quad \\Delta_2 = \\det(A)',
        options: [
          {
            id: 'a',
            latex: '\\Delta_1 = 5 > 0, \\;\\; \\Delta_2 = 6 > 0 \\implies \\text{SPD}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\Delta_1 = 5 > 0, \\;\\; \\Delta_2 = 14 > 0 \\implies \\text{SPD}',
            correct: false,
            misconception:
              'Check $\\det(A) = 5(2) - 2(2) = 10 - 4 = 6$, not $10 + 4 = 14$.',
          },
          {
            id: 'c',
            latex: '\\Delta_1 = 5 > 0, \\;\\; \\Delta_2 = 2 > 0 \\implies \\text{SPD}',
            correct: false,
            misconception:
              '$\\Delta_2$ is the full $2\\times 2$ determinant $5(2) - 2^2 = 6$, not the second diagonal entry $a_{22} = 2$!',
          },
          {
            id: 'd',
            latex: '\\Delta_2 = 6 > 0, \\text{ but } A \\text{ is NOT positive-definite}',
            correct: false,
            misconception:
              'By Sylvester\'s criterion, a symmetric matrix whose leading principal minors are ALL strictly positive ($5 > 0, 6 > 0$) is guaranteed SPD!',
          },
        ],
        lockedLabel: 'SPD Verified',
        lockedResultLatex:
          'A = A^T, \\;\\; \\Delta_1 = \\textcolor{#34D399}{5 > 0}, \\;\\; \\Delta_2 = \\textcolor{#34D399}{6 > 0} \\implies \\text{SPD}',
        hint: 'Compute $\\Delta_1 = 5$ and $\\Delta_2 = 5(2) - 2(2) = 6$; both must be strictly positive.',
      },
      {
        stepType: 'spd_eigenvalues',
        badge: 'Find Positive Eigenvalues',
        prompt:
          'Solve $\\lambda^2 - \\operatorname{tr}(A)\\lambda + \\det(A) = \\lambda^2 - 7\\lambda + 6 = 0$ to lock $\\Lambda$.',
        highlightLatex:
          '\\lambda^2 - \\textcolor{#22D3EE}{7}\\lambda + \\textcolor{#F59E0B}{6} = 0',
        options: [
          {
            id: 'a',
            latex: '\\lambda_1 = 5, \\quad \\lambda_2 = 2',
            correct: false,
            misconception:
              'Diagonal entries $5$ and $2$ sum to $7$, but their product is $10 \\neq \\det(A) = 6$ because of the off-diagonal $2$s.',
          },
          {
            id: 'b',
            latex: '\\lambda_1 = 3, \\quad \\lambda_2 = 2',
            correct: false,
            misconception:
              '$3 \\times 2 = 6$, but $3 + 2 = 5 \\neq \\operatorname{tr}(A) = 7$. Try $6$ and $1$!',
          },
          {
            id: 'c',
            latex: '\\lambda_1 = 6, \\quad \\lambda_2 = 1',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\lambda_1 = 6, \\quad \\lambda_2 = -1',
            correct: false,
            misconception:
              'An SPD matrix has ALL strictly positive eigenvalues! Plus $(6)(-1) = -6 \\neq +6$.',
          },
        ],
        lockedLabel: 'Eigenvalues Λ',
        lockedResultLatex:
          '\\lambda_1 = \\textcolor{#34D399}{6}, \\quad \\lambda_2 = \\textcolor{#34D399}{1} \\quad (\\text{both } > 0)',
        hint: 'Factor $(\\lambda - 6)(\\lambda - 1) = 0$ and verify sum $= 7$, product $= 6$.',
      },
      {
        stepType: 'spd_orthonormal_eigs',
        badge: 'Find Orthonormal Eigenvectors',
        prompt:
          'Solve $(A - 6I)\\mathbf{v}_1 = \\mathbf{0}$ and $(A - I)\\mathbf{v}_2 = \\mathbf{0}$, then normalize each to unit length.',
        highlightLatex:
          'A - 6I = \\begin{bmatrix} -1 & 2 \\\\ 2 & -4 \\end{bmatrix}, \\qquad A - I = \\begin{bmatrix} 4 & 2 \\\\ 2 & 1 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{q}_1 = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}, \\quad \\mathbf{q}_2 = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} -2 \\\\ 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check $(A - 6I)\\mathbf{v}_1$: $-1(1) + 2(2) = 3 \\neq 0$! From $-x_1 + 2x_2 = 0$, $x_1 = 2x_2 \\implies \\mathbf{v}_1 = [2, 1]^T$.',
          },
          {
            id: 'b',
            latex: '\\mathbf{q}_1 = \\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{q}_2 = \\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Those directions are right and orthogonal, but $Q$ MUST have UNIT-length columns ($Q^T Q = I$), so divide each by $\\sqrt{2^2 + 1^2} = \\sqrt{5}$!',
          },
          {
            id: 'c',
            latex: '\\mathbf{q}_1 = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{q}_2 = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathbf{q}_1 = \\frac{1}{5}\\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{q}_2 = \\frac{1}{5}\\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Divide by the norm $\\sqrt{5}$, not the squared norm $5$—with $\\frac{1}{5}$, $\\|\\mathbf{q}_1\\| = \\frac{1}{\\sqrt{5}} \\neq 1$.',
          },
        ],
        lockedLabel: 'Orthonormal Basis',
        lockedResultLatex:
          '\\mathbf{q}_1 = \\textcolor{#22D3EE}{\\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 \\\\ 1 \\end{bmatrix}}, \\quad \\mathbf{q}_2 = \\textcolor{#F59E0B}{\\frac{1}{\\sqrt{5}}\\begin{bmatrix} -1 \\\\ 2 \\end{bmatrix}}',
        hint: 'From $-x_1 + 2x_2 = 0$, $\\mathbf{v}_1 = [2, 1]^T$; from $2x_1 + x_2 = 0$, $\\mathbf{v}_2 = [-1, 2]^T$; both have norm $\\sqrt{5}$.',
      },
      {
        stepType: 'spd_spectral_assemble',
        badge: 'Assemble Spectral Form QΛQᵀ',
        prompt:
          'Because $Q$ is orthogonal ($Q^{-1} = Q^T$), assemble the spectral decomposition $A = Q\\Lambda Q^T$.',
        highlightLatex:
          'A = \\textcolor{#22D3EE}{Q}\\,\\textcolor{#34D399}{\\Lambda}\\,\\textcolor{#22D3EE}{Q^T}',
        options: [
          {
            id: 'a',
            latex: 'Q = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 & -1 \\\\ 1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 1 & 0 \\\\ 0 & 6 \\end{bmatrix}',
            correct: false,
            misconception:
              'Column 1 of $Q$ is $\\mathbf{q}_1$ (eigenvalue $6$) and Column 2 is $\\mathbf{q}_2$ (eigenvalue $1$), so $\\Lambda$ must put $6$ first and $1$ second!',
          },
          {
            id: 'b',
            latex: 'Q = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 & 1 \\\\ -1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 6 & 0 \\\\ 0 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'You placed $\\mathbf{q}_1$ and $\\mathbf{q}_2$ as ROWS instead of COLUMNS! Eigenvectors always stack as the COLUMNS of $Q$.',
          },
          {
            id: 'c',
            latex: 'Q = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 & -1 \\\\ 1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 6 & 0 \\\\ 0 & 1 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'Q = \\begin{bmatrix} 2 & -1 \\\\ 1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 6 & 0 \\\\ 0 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Without the $\\frac{1}{\\sqrt{5}}$ normalization factor, $Q\\Lambda Q^T = 5A \\neq A$!',
          },
        ],
        lockedLabel: 'Spectral Form',
        lockedResultLatex:
          'A = \\textcolor{#34D399}{Q\\Lambda Q^T}, \\quad Q = \\frac{1}{\\sqrt{5}}\\begin{bmatrix} 2 & -1 \\\\ 1 & 2 \\end{bmatrix}, \\quad \\Lambda = \\begin{bmatrix} 6 & 0 \\\\ 0 & 1 \\end{bmatrix}',
        hint: 'Place $\\mathbf{q}_1$ in column 1 paired with $\\lambda_1 = 6$, and $\\mathbf{q}_2$ in column 2 paired with $\\lambda_2 = 1$.',
      },
    ],
  },
];
