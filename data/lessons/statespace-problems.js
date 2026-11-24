/**
 * EIGENLAB — Controls 04: Modern State-Space Control, LQR/MPC/CBF-QP & SOTA Estimation
 * 12 deep, engineering-grade, multi-part (5–7 steps each) modern control & estimation
 * problems tailored for Mechatronics & Robotics Engineers:
 *   Tier 1: State-Space Matrices (A,B,C,D), Direct Feedthrough, Controllability/Observability & PBH
 *   Tier 2: Full-State Feedback, Ackermann/Pole Placement, Feedforward N̄, LQR Riccati (CARE) & iLQR/DDP
 *   Tier 3: Receding-Horizon MPC Condensed QP & Safety-Critical Control Barrier Functions (CBF-QP)
 *   Tier 4: Luenberger Observers, Doyle's LQG Margin Theorem, Discrete Kalman Filter (Joseph) & EKF vs UKF
 *   Tier 5: Modern SOTA Estimation — Factor Graphs (GTSAM/iSAM2), MHE & Invariant EKF (InEKF) on Lie Groups
 *
 * Every step includes:
 *  - whyThisStep  : Spoiler-free engineering rationale shown while solving.
 *  - systemImpact : Physical takeaway revealed on lock-in & pinned in the ledger.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Plant matrices (A,B,C,D) / state vector x / covariance P / Lie group X
 *  - Amber  (#F59E0B): Targets / weights (Q,R) / constraints / barrier h(x) / measurement z
 *  - Emerald(#34D399): Solved step result / optimal gains (K,L,K_k) / safe control u* / MAP estimate
 */

export const STATESPACE_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'state-space', label: 'State-Space & Matrices' },
  { id: 'lqr-optimal', label: 'State Feedback & LQR' },
  { id: 'mpc-cbf', label: 'MPC & CBF-QP Safety' },
  { id: 'observers-kf', label: 'Observers & Kalman' },
  { id: 'sota-estimation', label: 'SOTA: InEKF & MHE' },
];

export const STATESPACE_PROBLEMS = [
  // =========================================================================
  // TIER 1: STATE-SPACE MODELING, MATRICES (A,B,C,D) & PBH TESTS (3 problems)
  // =========================================================================
  {
    id: 'ss1-msd-matrix-table',
    tier: 'state-space',
    tierLabel: 'State-Space & Matrices',
    title: 'Mass-Spring-Damper → State Variables & (A,B,C,D) Matrix Table',
    mechatronicsContext:
      'Every modern controller (LQR, MPC, Kalman filter) starts by converting a physical ODE into coupled first-order matrix form ẋ = Ax + Bu, y = Cx + Du. Extracting the minimal energy-storage states and verifying Kalman rank matrices guarantees full controllability and velocity reconstruction from a single encoder.',
    expressionLatex:
      '\\ddot{x} + 6\\dot{x} + 25x = u, \\quad y = x \\;\\;\\longrightarrow\\;\\; (A, B, C, D),\\; \\mathcal{C},\\; \\mathcal{O}',
    finalAnswerLatex:
      'A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix},\\; D=0,\\; \\lambda=-3\\pm 4j,\\; \\operatorname{rank}(\\mathcal{C})=\\operatorname{rank}(\\mathcal{O})=2',
    diagram: {
      type: 'msd',
      m: '1',
      c: '6',
      k: '25',
      input: 'u(t)',
      output: 'x(t)',
      subtitle: 'MSD State-Space Extraction',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -6, maxRe: 2, minIm: -5.5, maxIm: 5.5 },
      poles: [
        { re: -3, im: 4, label: 'λ₁ = −3 + 4j', status: 'lhp' },
        { re: -3, im: -4, label: 'λ₂ = −3 − 4j', status: 'lhp' },
      ],
      hudLabel: 'eig(A) = −3 ± 4j · ζ = 0.6 · rank(𝒞)=rank(𝒪)=2',
      defaultCursor: 0.5,
      subtitle:
        'Eigenvalues of state matrix $A$ sit at $\\lambda = -3 \\pm 4j$ ($\\omega_n = 5\\text{ rad/s},\\; \\zeta = 0.6$), matching the transfer-function poles identically while exposing internal state controllability and observability.',
      domainMeta: 'State Matrix Spectrum · eig(A) = −3 ± 4j · Full Rank 2',
      metrics: [
        { label: 'State Dimension', value: 'n = 2 (x, ẋ)' },
        { label: 'eig(A)', value: '−3 ± 4j (ζ=0.6)' },
        { label: 'Controllability', value: 'det(𝒞) = −1 (Rank 2)' },
        { label: 'Observability', value: '𝒪 = I₂ (Rank 2) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'state_choice',
        badge: 'Choose Minimal Energy-Storage States',
        whyThisStep:
          'The minimal state dimension equals the number of independent energy-storage elements — choosing physical energy variables keeps every entry of the state vector directly meaningful for sensors and constraints.',
        systemImpact:
          'Elastic potential energy ($\\frac{1}{2}kx^2$) and kinetic energy ($\\frac{1}{2}m\\dot{x}^2$) are the two independent energy stores, locking the minimal state vector to $\\mathbf{x} = [x,\\; \\dot{x}]^T \\in \\mathbb{R}^2$ (order $n = 2$).',
        prompt:
          'Read the mass-spring-damper schematic ($m=1, c=6, k=25$) and select the minimal physical state vector $\\mathbf{x}(t)$ whose initial values completely determine future motion.',
        highlightLatex:
          'E_{\\text{stored}} = \\frac{1}{2}\\textcolor{#22D3EE}{k}\\,x^2 + \\frac{1}{2}\\textcolor{#22D3EE}{m}\\,\\dot{x}^2 \\implies \\mathbf{x} = \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{x} = \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} x \\\\ \\dot{x} \\end{bmatrix} \\quad (n = 2)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathbf{x} = \\begin{bmatrix} x \\\\ \\dot{x} \\\\ \\ddot{x} \\end{bmatrix} \\quad (n = 3)',
            correct: false,
            misconception:
              'Acceleration $\\ddot{x} = u - 6\\dot{x} - 25x$ is algebraically determined by $(x, \\dot{x}, u)$ — adding it creates a redundant non-minimal realization!',
          },
          {
            id: 'c',
            latex: '\\mathbf{x} = \\begin{bmatrix} x \\\\ u \\end{bmatrix} \\quad (n = 2)',
            correct: false,
            misconception:
              'The external drive $u(t)$ is an exogenous input, not an internal energy state; without $\\dot{x}$, you lose the mass momentum.',
          },
          {
            id: 'd',
            latex: '\\mathbf{x} = \\begin{bmatrix} x \\end{bmatrix} \\quad (n = 1)',
            correct: false,
            misconception:
              'A single scalar state cannot describe a second-order inertial system: knowing position $x(0)$ alone leaves initial velocity $\\dot{x}(0)$ unspecified.',
          },
        ],
        lockedLabel: 'Minimal State Vector',
        lockedResultLatex: '\\mathbf{x} = \\textcolor{#34D399}{\\begin{bmatrix} x \\\\ \\dot{x} \\end{bmatrix}} \\in \\mathbb{R}^2',
        hint: 'Count independent energy stores: spring displacement $x$ and mass velocity $\\dot{x}$ (the damper only dissipates energy).',
      },
      {
        stepType: 'first_order_ode',
        badge: 'Coupled 1st-Order State Equations',
        whyThisStep:
          'State-space solvers and integrators cannot act directly on $\\ddot{x}$; isolating the highest derivative turns any $n$-th order ODE into $n$ coupled first-order differential equations.',
        systemImpact:
          'Writing $\\dot{x}_1 = x_2$ and $\\dot{x}_2 = -25x_1 - 6x_2 + u$ exposes the companion-form structure where force enters strictly through the acceleration channel $\\dot{x}_2$.',
        prompt:
          'Substitute $x_1 = x$ and $x_2 = \\dot{x}$ into $\\ddot{x} + 6\\dot{x} + 25x = u$ to write the coupled first-order state equations.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\ddot{x}} = -\\textcolor{#F59E0B}{25}x - \\textcolor{#F59E0B}{6}\\dot{x} + u \\quad \\text{with } x_1 = x,\\; x_2 = \\dot{x}',
        options: [
          {
            id: 'a',
            latex: '\\dot{x}_1 = x_2, \\qquad \\dot{x}_2 = 25x_1 + 6x_2 + u',
            correct: false,
            misconception:
              'Moving $+6\\dot{x} + 25x$ across the equals sign negates both restoring terms to $-25x_1 - 6x_2$; positive signs would make the spring push away from equilibrium!',
          },
          {
            id: 'b',
            latex: '\\dot{x}_1 = x_2, \\qquad \\dot{x}_2 = -25x_1 - 6x_2 + u',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\dot{x}_1 = x_2 + u, \\qquad \\dot{x}_2 = -25x_1 - 6x_2',
            correct: false,
            misconception:
              'Force $u(t)$ produces acceleration $\\dot{x}_2 = \\ddot{x}$, never an instantaneous velocity jump in the kinematic identity $\\dot{x}_1 = x_2$.',
          },
          {
            id: 'd',
            latex: '\\dot{x}_1 = -6x_1 - 25x_2, \\qquad \\dot{x}_2 = x_1 + u',
            correct: false,
            misconception:
              'Keep the state ordering consistent: $\\dot{x}_1 = \\dot{x} = x_2$ is pure kinematics, while the force balance belongs in $\\dot{x}_2 = \\ddot{x}$.',
          },
        ],
        lockedLabel: '1st-Order System',
        lockedResultLatex: '\\textcolor{#34D399}{\\dot{x}_1 = x_2, \\quad \\dot{x}_2 = -25x_1 - 6x_2 + u}',
        hint: 'Use $\\dot{x}_1 = x_2$ by definition, then solve $\\dot{x}_2 = \\ddot{x} = u - 6x_2 - 25x_1$.',
      },
      {
        stepType: 'abcd_matrices',
        badge: 'Assemble (A, B, C, D) Matrix Table',
        whyThisStep:
          'Packing the scalar equations into $\\dot{\\mathbf{x}} = A\\mathbf{x} + B u,\\; y = C\\mathbf{x} + D u$ yields the universal canonical representation accepted by MATLAB/Python `ss()`, LQR, MPC, and Kalman filters.',
        systemImpact:
          'With $D = 0$, the plant is strictly proper — high-frequency actuator spikes are filtered twice by mass inertia before reaching position output $y = x_1$.',
        prompt:
          'Read off the four state-space matrices $(A, B, C, D)$ for $\\dot{x}_1 = x_2$, $\\dot{x}_2 = -25x_1 - 6x_2 + u$, and position output $y = x_1$.',
        highlightLatex:
          '\\dot{\\mathbf{x}} = \\textcolor{#22D3EE}{A}\\mathbf{x} + \\textcolor{#F59E0B}{B}u, \\qquad y = \\textcolor{#22D3EE}{C}\\mathbf{x} + \\textcolor{#F59E0B}{D}u',
        options: [
          {
            id: 'a',
            latex: 'A=\\begin{bmatrix}0&1\\\\-6&-25\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix},\\; D=0',
            correct: false,
            misconception:
              'In row 2 of $A$, column 1 multiplies $x_1$ ($-25$, stiffness) and column 2 multiplies $x_2$ ($-6$, damping) — do not swap $-25$ and $-6$!',
          },
          {
            id: 'b',
            latex: 'A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}1\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}0&1\\end{bmatrix},\\; D=0',
            correct: false,
            misconception:
              'Input $u$ acts on $\\dot{x}_2$ so $B=[0, 1]^T$, and position output $y=x_1$ selects the first state so $C=[1, 0]$.',
          },
          {
            id: 'c',
            latex: 'A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix},\\; D=0',
            correct: true,
          },
          {
            id: 'd',
            latex: 'A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix},\\; D=1',
            correct: false,
            misconception:
              'The output $y = x_1$ has NO explicit $u(t)$ term, so direct feedthrough is $D = 0$ (strictly proper).',
          },
        ],
        lockedLabel: '(A, B, C, D) Matrices',
        lockedResultLatex:
          '\\textcolor{#34D399}{A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix},\\; D=0}',
        hint: 'Row $i$ of $[A \\; B]$ holds the coefficients of $[x_1,\\; x_2,\\; u]$ in $\\dot{x}_i$; $y = 1\\cdot x_1 + 0\\cdot x_2 + 0\\cdot u$.',
      },
      {
        stepType: 'eigenvalues_a',
        badge: 'Verify Eigenvalues via det(sI − A)',
        whyThisStep:
          'Internal stability of any linear state-space system is governed solely by the eigenvalues of $A$, which correspond to the transfer-function poles when there are no hidden cancellations.',
        systemImpact:
          'Solving $\\det(sI - A) = s^2 + 6s + 25 = 0$ recovers $\\lambda = -3 \\pm 4j$ strictly inside the LHP ($\\sigma = -3 < 0$), proving exponential decay of all free state trajectories.',
        prompt:
          'Compute $\\det(sI - A) = 0$ for $A = \\begin{bmatrix}0 & 1 \\\\ -25 & -6\\end{bmatrix}$ to verify the open-loop eigenvalues.',
        highlightLatex:
          '\\det(\\textcolor{#22D3EE}{sI - A}) = \\det\\begin{bmatrix} s & -1 \\\\ 25 & s+6 \\end{bmatrix} = 0',
        options: [
          {
            id: 'a',
            latex: 's^2 + 6s + 25 = 0 \\implies \\lambda = -3 \\pm 4j',
            correct: true,
          },
          {
            id: 'b',
            latex: 's^2 + 6s - 25 = 0 \\implies \\lambda = -3 \\pm \\sqrt{34}',
            correct: false,
            misconception:
              'Watch the off-diagonal subtraction in a $2\\times 2$ determinant: $s(s+6) - (-1)(25) = s^2 + 6s + 25$, NOT $-25$!',
          },
          {
            id: 'c',
            latex: 's^2 - 6s + 25 = 0 \\implies \\lambda = +3 \\pm 4j',
            correct: false,
            misconception:
              'The diagonal entry of $sI - A$ is $s - (-6) = s + 6$, placing both roots in the stable LHP ($-3 \\pm 4j$).',
          },
          {
            id: 'd',
            latex: 's^2 + 6s + 25 = 0 \\implies \\lambda = -3 \\pm 5j',
            correct: false,
            misconception:
              'Completing the square gives $(s+3)^2 + (25 - 9) = (s+3)^2 + 16 = 0$, so the damped frequency is $\\omega_d = \\sqrt{16} = 4$, while $\\omega_n = 5$.',
          },
        ],
        lockedLabel: 'Open-Loop Eigenvalues',
        lockedResultLatex: '\\det(sI-A)=s^2+6s+25 \\implies \\lambda = \\textcolor{#34D399}{-3 \\pm 4j}',
        hint: 'Evaluate $s(s+6) - (-1)(25)$ and complete the square: $(s+3)^2 + 16 = 0$.',
      },
      {
        stepType: 'controllability_matrix',
        badge: 'Kalman Controllability Matrix 𝒞',
        whyThisStep:
          'Before designing state feedback or LQR, you must verify that the actuator input $u$ can steer every state direction in $\\mathbb{R}^n$ — tested algebraically by full rank of $\\mathcal{C} = [B \\; AB]$.',
        systemImpact:
          'Because $\\det(\\mathcal{C}) = -1 \\neq 0$ (rank 2), a single force actuator can arbitrarily assign both closed-loop poles and drive any initial $(x_0, \\dot{x}_0)$ to zero in finite time.',
        prompt:
          'Compute $AB$ and assemble the Kalman Controllability matrix $\\mathcal{C} = [B \\;\\; AB]$, then determine its determinant and rank.',
        highlightLatex:
          '\\mathcal{C} = \\begin{bmatrix} \\textcolor{#F59E0B}{B} & \\textcolor{#22D3EE}{A}\\textcolor{#F59E0B}{B} \\end{bmatrix}, \\qquad A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{C}=\\begin{bmatrix}0&0\\\\1&-6\\end{bmatrix}, \\quad \\det(\\mathcal{C})=0\\;(\\text{rank } 1)',
            correct: false,
            misconception:
              'Multiply row 1 of $A$ by $B$: $[0,\\; 1]\\,[0,\\; 1]^T = 1$, not $0$ — acceleration integrates into velocity and position!',
          },
          {
            id: 'b',
            latex: '\\mathcal{C}=\\begin{bmatrix}0&1\\\\1&-6\\end{bmatrix}, \\quad \\det(\\mathcal{C})=-1\\neq 0\\;(\\text{rank } 2,\\; \\text{controllable})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{C}=\\begin{bmatrix}1&0\\\\-6&1\\end{bmatrix}, \\quad \\det(\\mathcal{C})=1\\;(\\text{rank } 2)',
            correct: false,
            misconception:
              'Column 1 of $\\mathcal{C}$ is $B = [0, 1]^T$ and column 2 is $AB = [1, -6]^T$ — do not reverse the column order.',
          },
          {
            id: 'd',
            latex: '\\mathcal{C}=\\begin{bmatrix}0&-25\\\\1&-6\\end{bmatrix}, \\quad \\det(\\mathcal{C})=25\\;(\\text{rank } 2)',
            correct: false,
            misconception:
              '$AB$ selects the SECOND column of $A$ (which is $[1, -6]^T$), not the bottom row $[-25, -6]$.',
          },
        ],
        lockedLabel: 'Controllability Rank',
        lockedResultLatex: '\\mathcal{C}=\\textcolor{#34D399}{\\begin{bmatrix}0&1\\\\1&-6\\end{bmatrix}},\\; \\det=-1 \\implies \\text{Full Rank } 2',
        hint: 'Since $B = [0, 1]^T$, $AB$ is simply the second column of $A$.',
      },
      {
        stepType: 'observability_matrix',
        badge: 'Kalman Observability Matrix 𝒪',
        whyThisStep:
          'Most mechatronic stages carry an encoder ($x$) but no tachometer ($\\dot{x}$); checking full rank of $\\mathcal{O} = [C;\\; CA]$ proves whether an observer or Kalman filter can reconstruct hidden velocity.',
        systemImpact:
          'Obtaining $\\mathcal{O} = I_2$ (rank 2, perfectly conditioned!) confirms that measuring position alone completely determines velocity without needing a second physical sensor.',
        prompt:
          'Compute $CA$ and assemble the Kalman Observability matrix $\\mathcal{O} = \\begin{bmatrix} C \\\\ CA \\end{bmatrix}$, then determine its rank and sensor implication.',
        highlightLatex:
          '\\mathcal{O} = \\begin{bmatrix} \\textcolor{#F59E0B}{C} \\\\ \\textcolor{#F59E0B}{C}\\textcolor{#22D3EE}{A} \\end{bmatrix}, \\qquad C=\\begin{bmatrix}1&0\\end{bmatrix},\\; A=\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{O}=\\begin{bmatrix}1&0\\\\-25&-6\\end{bmatrix}, \\quad \\operatorname{rank}=2',
            correct: false,
            misconception:
              '$CA$ extracts the FIRST row of $A$ (which is $[0, 1]$), not the second row $[-25, -6]$.',
          },
          {
            id: 'b',
            latex: '\\mathcal{O}=\\begin{bmatrix}1&0\\\\0&0\\end{bmatrix}, \\quad \\operatorname{rank}=1\\;(\\text{unobservable})',
            correct: false,
            misconception:
              'Check the second entry of $CA = [1, 0]\\begin{bmatrix}0&1\\\\-25&-6\\end{bmatrix} = [0, 1]$ — velocity directly drives $\\dot{x}_1$, making it observable!',
          },
          {
            id: 'c',
            latex: '\\mathcal{O}=\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}=I_2, \\quad \\operatorname{rank}=2\\;(\\text{position reconstructs velocity})',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathcal{O}=\\begin{bmatrix}0&1\\\\1&0\\end{bmatrix}, \\quad \\operatorname{rank}=2',
            correct: false,
            misconception:
              'Row 1 of $\\mathcal{O}$ is $C = [1, 0]$ and row 2 is $CA = [0, 1]$, giving the identity matrix $I_2$.',
          },
        ],
        lockedLabel: 'Observability Rank',
        lockedResultLatex: '\\mathcal{O}=\\textcolor{#34D399}{\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}} \\implies \\text{Full Rank } 2\\;(\\text{Observable})',
        hint: 'Left-multiplying $A$ by $C = [1, 0]$ simply pulls out the first row of $A$.',
      },
    ],
  },

  {
    id: 'ss1-rlc-state-matrix',
    tier: 'state-space',
    tierLabel: 'State-Space & Matrices',
    title: 'Series RLC Circuit → Energy States (i_L, v_C), (A,B,C,D) & Feedthrough',
    mechatronicsContext:
      'Power-electronics buck converters, servo-drive LC filters, and piezo amplifiers are modeled directly via magnetic and electric energy states $(i_L, v_C)$. Measuring inductor voltage $y = v_L$ reveals a non-zero direct feedthrough $D = 1$, a critical distinction for switching noise and loop causality.',
    expressionLatex:
      'R=4\\,\\Omega,\\; L=0.5\\,\\text{H},\\; C=0.05\\,\\text{F},\\; y=v_L \\;\\;\\longrightarrow\\;\\; (A,B,C,D)',
    finalAnswerLatex:
      'A=\\begin{bmatrix}-8&-2\\\\20&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}-4&-1\\end{bmatrix},\\; D=1,\\; \\lambda=-4\\pm 2\\sqrt{6}\\,j',
    diagram: {
      type: 'rlc-series',
      R: '4 Ω',
      L: '0.5 H',
      C: '0.05 F',
      input: 'u(t)',
      output: 'v_C(t)',
      current: 'i_L(t)',
      subtitle: 'Series RLC Energy States',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -7, maxRe: 2, minIm: -6.5, maxIm: 6.5 },
      poles: [
        { re: -4, im: 4.899, label: 'λ₁ = −4 + 4.90j', status: 'lhp' },
        { re: -4, im: -4.899, label: 'λ₂ = −4 − 4.90j', status: 'lhp' },
      ],
      zeros: [{ re: 0, im: 0, label: 'z₁,₂ = 0 (D=1 biproper)' }],
      hudLabel: 'G(s) = s²/(s²+8s+40) · Relative Degree 0 (D = 1)',
      defaultCursor: 0.5,
      subtitle:
        'Inductor voltage output $y = v_L$ creates a biproper high-pass transfer function $G(s) = s^2/(s^2+8s+40)$ with double zero at $0$ and poles at $-4 \\pm 2\\sqrt{6}\\,j$, reflecting direct feedthrough $D = 1$.',
      domainMeta: 'Series RLC Spectrum · eig(A) = −4 ± 4.90j · D = 1',
      metrics: [
        { label: 'Energy States', value: 'x = [i_L, v_C]ᵀ' },
        { label: 'eig(A)', value: '−4 ± 4.90j (ζ=0.63)' },
        { label: 'Feedthrough D', value: 'D = 1 (Rel. Deg. 0)' },
        { label: 'Obs (v_C or i_L)', value: 'Both Rank 2 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'rlc_energy_states',
        badge: 'Pick Magnetic & Electric Energy States',
        whyThisStep:
          'In electrical circuits, inductor currents and capacitor voltages cannot change instantaneously without infinite voltage or current — making them the natural continuous state variables.',
        systemImpact:
          'Selecting $x_1 = i_L$ (magnetic energy $\\frac{1}{2}L i_L^2$) and $x_2 = v_C$ (electric energy $\\frac{1}{2}C v_C^2$) guarantees a minimal 2-state realization regardless of how many resistors are present.',
        prompt:
          'Inspect the series RLC schematic ($R = 4\\,\\Omega, L = 0.5\\,\\text{H}, C = 0.05\\,\\text{F}$) and select the canonical energy-storage state vector $\\mathbf{x}$.',
        highlightLatex:
          'E_{\\text{mag}} = \\frac{1}{2}\\textcolor{#22D3EE}{L}\\,i_L^2, \\qquad E_{\\text{elec}} = \\frac{1}{2}\\textcolor{#22D3EE}{C}\\,v_C^2',
        options: [
          {
            id: 'a',
            latex: '\\mathbf{x} = \\begin{bmatrix} v_R \\\\ v_L \\end{bmatrix}',
            correct: false,
            misconception:
              'Resistor voltage $v_R = R i_L$ is algebraic and inductor voltage $v_L = L\\dot{i}_L$ can jump instantaneously when $u(t)$ steps — neither is a continuous energy state.',
          },
          {
            id: 'b',
            latex: '\\mathbf{x} = \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} i_L \\\\ v_C \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathbf{x} = \\begin{bmatrix} i_L \\\\ v_C \\\\ v_R \\end{bmatrix}',
            correct: false,
            misconception:
              'Resistors store ZERO energy ($v_R = R x_1$ is redundant), so adding $v_R$ inflates the state order unnecessarily.',
          },
          {
            id: 'd',
            latex: '\\mathbf{x} = \\begin{bmatrix} u \\\\ i_L \\end{bmatrix}',
            correct: false,
            misconception:
              'The source voltage $u(t)$ is the external input, not an internal state; dropping $v_C$ loses the capacitor charge state.',
          },
        ],
        lockedLabel: 'RLC Energy States',
        lockedResultLatex: '\\mathbf{x} = \\textcolor{#34D399}{\\begin{bmatrix} i_L \\\\ v_C \\end{bmatrix}} \\in \\mathbb{R}^2',
        hint: 'Match each energy-storage component to its continuous state: inductor $\\to i_L$, capacitor $\\to v_C$.',
      },
      {
        stepType: 'kvl_state_eqs',
        badge: 'Derive State Derivatives from KVL & C-Law',
        whyThisStep:
          'Applying Kirchhoff’s Voltage Law around the loop and the capacitor current law isolates $\\dot{i}_L$ and $\\dot{v}_C$ directly in terms of $(i_L, v_C, u)$ without differentiating the input.',
        systemImpact:
          'Dividing by $L = 0.5\\text{ H}$ and $C = 0.05\\text{ F}$ scales the dynamics cleanly into $\\dot{x}_1 = -8x_1 - 2x_2 + 2u$ and $\\dot{x}_2 = 20x_1$.',
        prompt:
          'Use $L\\dot{i}_L + R i_L + v_C = u$ and $C\\dot{v}_C = i_L$ with $R=4, L=0.5, C=0.05$ to derive $\\dot{x}_1$ and $\\dot{x}_2$.',
        highlightLatex:
          '\\dot{x}_1 = \\frac{1}{\\textcolor{#22D3EE}{0.5}}\\,(u - \\textcolor{#F59E0B}{4}x_1 - x_2), \\qquad \\dot{x}_2 = \\frac{1}{\\textcolor{#22D3EE}{0.05}}\\,x_1',
        options: [
          {
            id: 'a',
            latex: '\\dot{x}_1 = -8x_1 - 2x_2 + 2u, \\qquad \\dot{x}_2 = 20x_1',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\dot{x}_1 = -2x_1 - 0.5x_2 + 0.5u, \\qquad \\dot{x}_2 = 0.05x_1',
            correct: false,
            misconception:
              'You multiplied by $L$ and $C$ instead of dividing! Dividing by $L = 0.5$ multiplies by $2$, and dividing by $C = 0.05$ multiplies by $20$.',
          },
          {
            id: 'c',
            latex: '\\dot{x}_1 = -8x_1 + 2x_2 + 2u, \\qquad \\dot{x}_2 = -20x_1',
            correct: false,
            misconception:
              'Check passive sign conventions: capacitor voltage $v_C$ opposes the source in KVL ($-2x_2$), and positive $i_L$ charges the capacitor ($+20x_1$).',
          },
          {
            id: 'd',
            latex: '\\dot{x}_1 = -4x_1 - x_2 + u, \\qquad \\dot{x}_2 = 20x_1',
            correct: false,
            misconception:
              'Do not forget to divide the KVL equation by $L = 0.5\\text{ H}$ to isolate $\\dot{x}_1$ with coefficient $1$.',
          },
        ],
        lockedLabel: 'RLC State ODEs',
        lockedResultLatex: '\\textcolor{#34D399}{\\dot{x}_1 = -8x_1 - 2x_2 + 2u, \\quad \\dot{x}_2 = 20x_1}',
        hint: 'Remember $1/0.5 = 2$ and $1/0.05 = 20$.',
      },
      {
        stepType: 'rlc_abcd_feedthrough',
        badge: 'Assemble (A, B, C, D) for y = v_L',
        whyThisStep:
          'When the measured output is an algebraic combination of input and states (like inductor voltage $v_L = u - R i_L - v_C$), the direct feedthrough scalar $D$ becomes non-zero.',
        systemImpact:
          'Because $v_L = -4x_1 - x_2 + 1\\cdot u$, we get $C = [-4,\\; -1]$ and $D = 1$ — exposing an instantaneous input-to-output path!',
        prompt:
          'Now let the sensor measure inductor voltage $y(t) = v_L(t) = L\\dot{i}_L = u - R x_1 - x_2$. Assemble the complete $(A, B, C, D)$ matrices.',
        highlightLatex:
          'y = v_L = \\textcolor{#F59E0B}{u} - \\textcolor{#22D3EE}{4}x_1 - \\textcolor{#22D3EE}{1}x_2 = C\\mathbf{x} + \\textcolor{#F59E0B}{D}u',
        options: [
          {
            id: 'a',
            latex: 'A=\\begin{bmatrix}-8&-2\\\\20&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}-4&-1\\end{bmatrix},\\; D=0',
            correct: false,
            misconception:
              'Dropping the $+u$ term in $v_L = u - 4x_1 - x_2$ wrongly sets $D = 0$, missing the instantaneous step jump across the inductor!',
          },
          {
            id: 'b',
            latex: 'A=\\begin{bmatrix}-8&-2\\\\20&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}-8&-2\\end{bmatrix},\\; D=2',
            correct: false,
            misconception:
              'That is $\\dot{x}_1 = v_L / L$, not $v_L = L\\dot{x}_1$! Multiply by $L = 0.5$ to get $C = [-4, -1]$ and $D = 1$.',
          },
          {
            id: 'c',
            latex: 'A=\\begin{bmatrix}-8&-2\\\\20&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}-4&-1\\end{bmatrix},\\; D=1',
            correct: true,
          },
          {
            id: 'd',
            latex: 'A=\\begin{bmatrix}-8&20\\\\-2&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}0&1\\end{bmatrix},\\; D=0',
            correct: false,
            misconception:
              'Here $A$ is transposed AND $C = [0, 1], D = 0$ corresponds to capacitor voltage $y = v_C$, not inductor voltage $y = v_L$.',
          },
        ],
        lockedLabel: 'RLC (A,B,C,D)',
        lockedResultLatex:
          '\\textcolor{#34D399}{A=\\begin{bmatrix}-8&-2\\\\20&0\\end{bmatrix},\\; B=\\begin{bmatrix}2\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}-4&-1\\end{bmatrix},\\; D=1}',
        hint: 'Write $y = v_L = -4x_1 - 1\\cdot x_2 + 1\\cdot u$ and read off $C$ and $D$.',
      },
      {
        stepType: 'rlc_eig',
        badge: 'Characteristic Polynomial & Circuit Modes',
        whyThisStep:
          'Checking $\\det(sI - A)$ verifies the natural ringing frequency and damping ratio of the RLC filter independently of which output voltage or current you probe.',
        systemImpact:
          'The eigenvalues $\\lambda = -4 \\pm 2\\sqrt{6}\\,j \\approx -4 \\pm 4.90j$ give $\\omega_n = \\sqrt{40} \\approx 6.32\\text{ rad/s}$ and $\\zeta = 4/\\sqrt{40} \\approx 0.632$ (well-damped LHP resonance).',
        prompt:
          'Evaluate $\\det(sI - A) = 0$ for $A = \\begin{bmatrix}-8 & -2 \\\\ 20 & 0\\end{bmatrix}$ to find the exact circuit eigenvalues.',
        highlightLatex:
          '\\det(\\textcolor{#22D3EE}{sI - A}) = \\det\\begin{bmatrix} s+8 & 2 \\\\ -20 & s \\end{bmatrix} = 0',
        options: [
          {
            id: 'a',
            latex: 's^2 + 8s - 40 = 0 \\implies \\lambda = -4 \\pm \\sqrt{56}',
            correct: false,
            misconception:
              'Check the off-diagonal sign: $s(s+8) - (2)(-20) = s^2 + 8s + 40$, not $-40$ (passive RLC circuits cannot have RHP poles!).',
          },
          {
            id: 'b',
            latex: 's^2 + 8s + 40 = 0 \\implies \\lambda = -4 \\pm 2\\sqrt{6}\\,j',
            correct: true,
          },
          {
            id: 'c',
            latex: 's^2 + 8s + 40 = 0 \\implies \\lambda = -4 \\pm \\sqrt{40}\\,j',
            correct: false,
            misconception:
              'Complete the square: $(s+4)^2 + (40 - 16) = (s+4)^2 + 24 = 0$, so the imaginary part is $\\sqrt{24} = 2\\sqrt{6}$, not $\\sqrt{40}$.',
          },
          {
            id: 'd',
            latex: 's^2 + 4s + 20 = 0 \\implies \\lambda = -2 \\pm 4j',
            correct: false,
            misconception:
              'Remember $R/L = 4/0.5 = 8$ and $1/(LC) = 1/(0.025) = 40$, giving $s^2 + 8s + 40 = 0$.',
          },
        ],
        lockedLabel: 'RLC Eigenvalues',
        lockedResultLatex: 's^2+8s+40=0 \\implies \\lambda = \\textcolor{#34D399}{-4 \\pm 2\\sqrt{6}\\,j}',
        hint: 'Expand $s(s+8) - (2)(-20) = s^2 + 8s + 40$ and solve $(s+4)^2 = -24$.',
      },
      {
        stepType: 'rlc_sensor_obs',
        badge: 'Compare Observability: v_C vs. i_L Sensor',
        whyThisStep:
          'Hardware engineers choose between cheap voltage dividers ($v_C$) and Hall-effect current sensors ($i_L$); checking $\\mathcal{O}$ for each sensor proves whether a single transducer recovers the full state.',
        systemImpact:
          'Both $\\mathcal{O}_{v_C}$ ($\\det = -20$) and $\\mathcal{O}_{i_L}$ ($\\det = -2$) have full rank 2, so EITHER a single voltage probe OR a single current shunt suffices for full-state estimation!',
        prompt:
          'Compare the observability matrices $\\mathcal{O} = [C;\\; CA]$ when measuring only capacitor voltage ($C_1 = [0\\; 1]$) versus only inductor current ($C_2 = [1\\; 0]$).',
        highlightLatex:
          'A = \\begin{bmatrix}-8 & -2 \\\\ 20 & 0\\end{bmatrix}, \\qquad \\textcolor{#F59E0B}{C_1 = [0\\; 1]}, \\quad \\textcolor{#22D3EE}{C_2 = [1\\; 0]}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{O}_1=\\begin{bmatrix}0&1\\\\20&0\\end{bmatrix}\\;(\\text{rank }2), \\quad \\mathcal{O}_2=\\begin{bmatrix}1&0\\\\-8&-2\\end{bmatrix}\\;(\\text{rank }2) \\implies \\text{Both observable}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathcal{O}_1\\text{ has rank }2, \\quad \\mathcal{O}_2\\text{ has rank }1 \\implies \\text{Only } v_C \\text{ is observable}',
            correct: false,
            misconception:
              'Check $\\det(\\mathcal{O}_2) = (1)(-2) - (0)(-8) = -2 \\neq 0$! Because $v_C$ directly enters $\\dot{i}_L = -8i_L - 2v_C + 2u$, measuring $i_L$ reveals $v_C$ as well.',
          },
          {
            id: 'c',
            latex: '\\mathcal{O}_1\\text{ has rank }1, \\quad \\mathcal{O}_2\\text{ has rank }2 \\implies \\text{Only } i_L \\text{ is observable}',
            correct: false,
            misconception:
              'Because $\\dot{v}_C = 20 i_L$, $C_1 A = [20,\\; 0]$ is linearly independent of $C_1 = [0,\\; 1]$ ($\\det = -20 \\neq 0$), so $v_C$ is fully observable too!',
          },
          {
            id: 'd',
            latex: '\\text{Neither single sensor has rank } 2; \\text{ both } v_C \\text{ and } i_L \\text{ must be measured}',
            correct: false,
            misconception:
              'In a series RLC loop, $i_L$ and $v_C$ are tightly coupled through both off-diagonal entries ($-2$ and $+20$), so either sensor alone gives rank 2.',
          },
        ],
        lockedLabel: 'Sensor Comparison',
        lockedResultLatex: '\\textcolor{#34D399}{\\operatorname{rank}(\\mathcal{O}_{v_C}) = \\operatorname{rank}(\\mathcal{O}_{i_L}) = 2}',
        hint: '$C_1 A$ is row 2 of $A$ ($[20, 0]$); $C_2 A$ is row 1 of $A$ ($[-8, -2]$). Check both determinants.',
      },
      {
        stepType: 'feedthrough_physics',
        badge: 'Physical Meaning of Direct Feedthrough D ≠ 0',
        whyThisStep:
          'Knowing when $D \\neq 0$ protects you against algebraic loops in digital controllers and explains why high-frequency PWM switching noise blasts straight through an inductor voltage tap.',
        systemImpact:
          'With $D = 1$, $G(s) = C(sI-A)^{-1}B + D = \\frac{s^2}{s^2+8s+40}$ has relative degree $0$: a step jump in $u(t)$ appears instantaneously across $v_L(0^+) = u(0^+)$ because $i_L$ and $v_C$ cannot jump!',
        prompt:
          'What is the exact physical and frequency-domain consequence of having direct feedthrough $D = 1 \\neq 0$ for output $y = v_L$?',
        highlightLatex:
          'G(s) = C(sI-A)^{-1}B + \\textcolor{#F59E0B}{D} = \\frac{-8s-40}{s^2+8s+40} + \\textcolor{#F59E0B}{1} = \\frac{s^2}{s^2+8s+40}',
        options: [
          {
            id: 'a',
            latex: 'D \\neq 0 \\text{ makes the circuit unstable because high-frequency gain does not vanish}',
            correct: false,
            misconception:
              'Stability depends purely on $\\operatorname{eig}(A)$ ($-4 \\pm 2\\sqrt{6}\\,j$ in LHP), never on $D$! Biproper filters like high-pass networks are completely stable.',
          },
          {
            id: 'b',
            latex: '\\text{Relative degree } 0\\text{ (biproper): input jumps pass instantaneously to } y(0^+)\\text{ and } \\lim_{\\omega\\to\\infty}|G(j\\omega)| = |D| = 1',
            correct: true,
          },
          {
            id: 'c',
            latex: 'D = 1 \\text{ forces the DC gain } G(0) = 1 \\text{ regardless of } A, B, C',
            correct: false,
            misconception:
              'Evaluate at $s = 0$: $G(0) = -C A^{-1} B + D = -1 + 1 = 0$ (an inductor is a dead short at DC!). $D$ sets the $\\omega \\to \\infty$ gain, NOT DC gain.',
          },
          {
            id: 'd',
            latex: 'D \\neq 0 \\text{ shifts the eigenvalues of } A \\text{ toward the imaginary axis}',
            correct: false,
            misconception:
              'Output matrices $(C, D)$ never modify the internal dynamics matrix $A$ or its eigenvalues in open loop.',
          },
        ],
        lockedLabel: 'Feedthrough Physics',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Relative Degree } 0: \\; G(\\infty) = D = 1 \\;(\\text{instant jump in } v_L)}',
        hint: 'Check $\\lim_{s\\to\\infty} G(s)$ and recall that $i_L(0^+) = 0, v_C(0^+) = 0$ on a step input.',
      },
    ],
  },

  {
    id: 'ss1-pbh-uncontrollable',
    tier: 'state-space',
    tierLabel: 'State-Space & Matrices',
    title: 'Modal Structure, PBH Rank Test & Stabilizability vs. Detectability',
    mechatronicsContext:
      'Real multi-body robots and redundant actuators frequently fail strict Kalman full-rank tests due to benign, well-damped parasitic or symmetric modes. The Popov-Belevitch-Hautus (PBH) test isolates WHICH eigenvalue is hidden—proving whether LQR (stabilizability) and Kalman Filters (detectability) still converge.',
    expressionLatex:
      'A=\\begin{bmatrix}1&0\\\\0&-3\\end{bmatrix},\\; B=\\begin{bmatrix}1\\\\0\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix} \\;\\;\\longrightarrow\\;\\; \\text{PBH Rank Test}',
    finalAnswerLatex:
      '\\lambda_1=+1\\;(\\text{ctrl \\& obs}),\\; \\lambda_2=-3\\;(\\text{hidden, LHP}) \\implies \\text{Stabilizable \\& Detectable ✓}',
    diagram: {
      type: 'state-space-loop',
      variant: 'pbh',
      A: 'diag(1, −3)',
      B: '[1, 0]ᵀ',
      C: '[1, 0]',
      controller: 'PBH Test',
      observer: 'Modal Split',
      subtitle: 'Stabilizability & Detectability',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -4.5, maxRe: 2.5, minIm: -2.2, maxIm: 2.2 },
      poles: [
        { re: 1, im: 0, label: 'λ₁=+1 (RHP · ctrl/obs)', status: 'rhp' },
        { re: -3, im: 0, label: 'λ₂=−3 (LHP · hidden)', status: 'lhp' },
      ],
      hudLabel: 'Unstable λ₁=+1 IS Ctrl & Obs · Hidden λ₂=−3 Is Strictly LHP',
      defaultCursor: 0.5,
      subtitle:
        'Mode map of $A = \\operatorname{diag}(1, -3)$: although $\\operatorname{rank}(\\mathcal{C}) = \\operatorname{rank}(\\mathcal{O}) = 1 < 2$, the ONLY uncontrollable/unobservable mode sits safely at $\\lambda_2 = -3$ in the LHP, so $(A,B)$ is stabilizable and $(A,C)$ is detectable!',
      domainMeta: 'PBH Modal Diagnosis · Stabilizable & Detectable',
      metrics: [
        { label: 'Modes eig(A)', value: '+1 (RHP), −3 (LHP)' },
        { label: 'Kalman Rank', value: 'rank(𝒞)=rank(𝒪)=1' },
        { label: 'Stabilizable?', value: 'YES (λ₂=−3 < 0) ✓' },
        { label: 'Detectable?', value: 'YES (λ₂=−3 < 0) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'modal_eigs',
        badge: 'Extract Decoupled Modal Eigenvalues',
        whyThisStep:
          'When $A$ is diagonal (modal coordinates), each scalar mode evolves independently and you can immediately inspect which modes are unstable ($\\operatorname{Re}(\\lambda) \\ge 0$) and require active stabilization.',
        systemImpact:
          'Mode 1 ($\\lambda_1 = +1$) grows exponentially ($e^{+t}$, unstable RHP) and MUST be controlled and observed, while Mode 2 ($\\lambda_2 = -3$) decays naturally ($e^{-3t}$, strictly LHP).',
        prompt:
          'Read the eigenvalues of $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & -3 \\end{bmatrix}$ and classify each open-loop mode.',
        highlightLatex:
          'A = \\begin{bmatrix} \\textcolor{#F59E0B}{1} & 0 \\\\ 0 & \\textcolor{#22D3EE}{-3} \\end{bmatrix} \\implies \\dot{x}_1 = x_1 + u, \\quad \\dot{x}_2 = -3x_2',
        options: [
          {
            id: 'a',
            latex: '\\lambda_1 = +1\\;(\\text{unstable RHP}), \\qquad \\lambda_2 = -3\\;(\\text{stable LHP})',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\lambda_1 = -1\\;(\\text{stable LHP}), \\qquad \\lambda_2 = +3\\;(\\text{unstable RHP})',
            correct: false,
            misconception:
              'For a diagonal matrix, the eigenvalues ARE the diagonal entries directly (do not flip their signs!).',
          },
          {
            id: 'c',
            latex: '\\lambda_{1,2} = -1 \\pm \\sqrt{3}\\,j\\;(\\text{oscillatory LHP})',
            correct: false,
            misconception:
              'There are zero off-diagonal couplings, so $\\det(sI-A) = (s-1)(s+3) = 0$ has purely real roots $+1$ and $-3$.',
          },
          {
            id: 'd',
            latex: '\\text{System is open-loop stable because } \\operatorname{tr}(A) = -2 < 0',
            correct: false,
            misconception:
              'A negative trace only means the SUM of eigenvalues is negative; a single RHP pole ($\\lambda_1 = +1$) makes the system open-loop unstable!',
          },
        ],
        lockedLabel: 'Modal Spectrum',
        lockedResultLatex: '\\lambda_1 = \\textcolor{#F59E0B}{+1\\;(\\text{RHP})}, \\quad \\lambda_2 = \\textcolor{#34D399}{-3\\;(\\text{LHP})}',
        hint: 'Diagonal entries of a diagonal matrix are directly its eigenvalues.',
      },
      {
        stepType: 'kalman_rank_fail',
        badge: 'Kalman Controllability Rank Deficiency',
        whyThisStep:
          'Computing $\\mathcal{C} = [B \\; AB]$ gives a binary pass/fail on complete controllability — when it drops rank, it signals you must dig deeper with PBH rather than giving up on control.',
        systemImpact:
          'Finding $\\operatorname{rank}(\\mathcal{C}) = 1 < 2$ proves the pair $(A,B)$ is NOT completely controllable, yet Kalman’s matrix alone does NOT tell you whether the uncontrollable mode is the unstable $+1$ or the benign $-3$!',
        prompt:
          'Form the Kalman Controllability matrix $\\mathcal{C} = [B \\;\\; AB]$ for $A = \\operatorname{diag}(1, -3),\\; B = [1, 0]^T$ and compute its rank.',
        highlightLatex:
          '\\mathcal{C} = \\begin{bmatrix} \\textcolor{#F59E0B}{B} & \\textcolor{#22D3EE}{A}\\textcolor{#F59E0B}{B} \\end{bmatrix}, \\qquad AB = \\begin{bmatrix}1&0\\\\0&-3\\end{bmatrix}\\begin{bmatrix}1\\\\0\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{C} = \\begin{bmatrix} 1 & 1 \\\\ 0 & -3 \\end{bmatrix}, \\quad \\operatorname{rank}(\\mathcal{C}) = 2\\;(\\text{controllable})',
            correct: false,
            misconception:
              'Multiply carefully: the second entry of $AB$ is $0\\cdot 1 + (-3)\\cdot 0 = 0$, not $-3$!',
          },
          {
            id: 'b',
            latex: '\\mathcal{C} = \\begin{bmatrix} 1 & 1 \\\\ 0 & 0 \\end{bmatrix}, \\quad \\operatorname{rank}(\\mathcal{C}) = 1 < 2\\;(\\text{uncontrollable})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{C} = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, \\quad \\operatorname{rank}(\\mathcal{C}) = 1',
            correct: false,
            misconception:
              'Check $AB$: $1\\cdot 1 = 1$ in the top entry, so $AB = [1, 0]^T$ (identical to $B$), giving $[1, 1;\\; 0, 0]$.',
          },
          {
            id: 'd',
            latex: '\\mathcal{C} = \\begin{bmatrix} 1 & -3 \\\\ 0 & 0 \\end{bmatrix}, \\quad \\operatorname{rank}(\\mathcal{C}) = 1',
            correct: false,
            misconception:
              '$B = [1, 0]^T$ lies in the eigenspace of $\\lambda_1 = +1$, so $AB = (+1)B = [1, 0]^T$.',
          },
        ],
        lockedLabel: 'Kalman Rank Check',
        lockedResultLatex: '\\mathcal{C} = \\textcolor{#F59E0B}{\\begin{bmatrix}1&1\\\\0&0\\end{bmatrix}}, \\; \\operatorname{rank} = 1 < 2',
        hint: 'Since $B$ is an eigenvector of $A$ with eigenvalue $+1$, $AB = B$.',
      },
      {
        stepType: 'pbh_ctrl_test',
        badge: 'PBH Test: Isolate Uncontrollable Eigenvalue',
        whyThisStep:
          'Unlike Kalman’s global matrix, the Popov-Belevitch-Hautus (PBH) test probes each eigenvalue $\\lambda_i$ individually via $\\operatorname{rank}[A - \\lambda_i I \\;\\; B]$ — pinpointing exactly which physical mode the actuator cannot touch.',
        systemImpact:
          'The PBH matrix has full rank $2$ at $\\lambda_1 = +1$ (actuator commands the unstable mode!) and drops to rank $1$ ONLY at $\\lambda_2 = -3$.',
        prompt:
          'Evaluate the PBH controllability matrix $[A - \\lambda I \\;\\; B]$ at both $\\lambda_1 = +1$ and $\\lambda_2 = -3$ to identify which mode is uncontrollable.',
        highlightLatex:
          '\\text{PBH}(\\lambda) = \\begin{bmatrix} \\textcolor{#22D3EE}{1-\\lambda} & 0 & \\textcolor{#F59E0B}{1} \\\\ 0 & \\textcolor{#22D3EE}{-3-\\lambda} & \\textcolor{#F59E0B}{0} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\lambda_1=+1:\\; \\operatorname{rank}=1\\;(\\text{uncontrollable}); \\quad \\lambda_2=-3:\\; \\operatorname{rank}=2\\;(\\text{controllable})',
            correct: false,
            misconception:
              'Plug in $\\lambda_1 = +1$: $[0, 0, 1;\\; 0, -4, 0]$ has two independent rows (rank 2)! The rank drops to 1 at $\\lambda_2 = -3$, where row 2 becomes $[0, 0, 0]$.',
          },
          {
            id: 'b',
            latex: '\\text{Both } \\lambda_1=+1 \\text{ and } \\lambda_2=-3 \\text{ drop to rank } 1',
            correct: false,
            misconception:
              'At $\\lambda_1 = +1$, column 3 ($B = [1, 0]^T$) restores row 1 while column 2 ($[0, -4]^T$) spans row 2, giving full rank 2.',
          },
          {
            id: 'c',
            latex: '\\lambda_1=+1:\\; \\operatorname{rank}\\begin{bmatrix}0&0&1\\\\0&-4&0\\end{bmatrix}=2\\;(\\text{ctrl}); \\quad \\lambda_2=-3:\\; \\operatorname{rank}\\begin{bmatrix}4&0&1\\\\0&0&0\\end{bmatrix}=1\\;(\\text{unctrl})',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Both } \\lambda_1=+1 \\text{ and } \\lambda_2=-3 \\text{ have rank } 2',
            correct: false,
            misconception:
              'If every eigenvalue had PBH rank $n = 2$, the system would be completely controllable — contradicting $\\operatorname{rank}(\\mathcal{C}) = 1$!',
          },
        ],
        lockedLabel: 'PBH Mode Isolation',
        lockedResultLatex: '\\lambda_1=+1: \\textcolor{#34D399}{\\text{rank }2\\;(\\text{ctrl})}, \\quad \\lambda_2=-3: \\textcolor{#F59E0B}{\\text{rank }1\\;(\\text{unctrl})}',
        hint: 'Substitute $\\lambda = 1$ and $\\lambda = -3$ into $[A - \\lambda I \\;\\; B]$ and look for an all-zero row.',
      },
      {
        stepType: 'stabilizability_verdict',
        badge: 'Classify Stabilizability (LQR / MPC Gate)',
        whyThisStep:
          'You rarely need to move EVERY eigenvalue of a complex robot — LQR, MPC, and Riccati solvers only require that every *unstable or marginal* eigenvalue ($\\operatorname{Re}(\\lambda) \\ge 0$) be controllable.',
        systemImpact:
          'Because the sole uncontrollable mode $\\lambda_2 = -3$ sits strictly in the LHP, $(A, B)$ IS **stabilizable**: a stabilizing feedback $u = -k_1 x_1$ drives $\\lambda_1$ to any LHP location while $\\lambda_2 = -3$ quietly decays to zero!',
        prompt:
          'Using the PBH results ($\\lambda_1 = +1$ controllable, $\\lambda_2 = -3$ uncontrollable), classify whether $(A,B)$ is stabilizable and explain its impact on LQR/MPC.',
        highlightLatex:
          '\\text{Uncontrollable set: } \\{\\textcolor{#34D399}{\\lambda_2 = -3}\\} \\subset \\mathbb{C}^- \\;(\\operatorname{Re}(\\lambda) < 0)',
        options: [
          {
            id: 'a',
            latex: '\\text{NOT stabilizable: LQR/MPC strictly require full Kalman controllability } (\\operatorname{rank}\\mathcal{C}=n)',
            correct: false,
            misconception:
              'Common textbook myth! Full controllability is sufficient but NOT necessary; **stabilizability** is the exact necessary & sufficient condition for a stabilizing LQR/MPC solution.',
          },
          {
            id: 'b',
            latex: '\\text{Stabilizable: every uncontrollable mode } (\\lambda_2=-3) \\text{ is strictly LHP} \\implies \\text{LQR/MPC exist \\& stabilize}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Unstabilizable because } \\lambda_1 = +1 \\text{ is in the open-loop RHP}',
            correct: false,
            misconception:
              'An open-loop RHP pole is totally fine as long as it IS controllable! Here $\\lambda_1 = +1$ has PBH rank 2, so feedback easily moves it into the LHP.',
          },
          {
            id: 'd',
            latex: '\\text{Stabilizable only if we place } \\lambda_2 \\text{ at } -10 \\text{ using state feedback}',
            correct: false,
            misconception:
              'An uncontrollable eigenvalue ($\\lambda_2 = -3$) is invariant under ALL state feedback $u = -Kx$ — it stays fixed at $-3$, which is already safely stable!',
          },
        ],
        lockedLabel: 'Stabilizability Verdict',
        lockedResultLatex: '(A,B)\\;\\text{is } \\textcolor{#34D399}{\\text{STABILIZABLE}} \\;(\\text{sufficient for LQR \\& MPC})',
        hint: 'Check whether any uncontrollable mode has $\\operatorname{Re}(\\lambda) \\ge 0$.',
      },
      {
        stepType: 'pbh_detectability',
        badge: 'Dual PBH Detectability Check (Kalman Gate)',
        whyThisStep:
          'By control-estimation duality, an observer or Kalman Filter only needs **detectability** — every unobservable mode must decay naturally in the LHP so estimation errors still vanish as $t \\to \\infty$.',
        systemImpact:
          'Checking $\\operatorname{rank}[A-\\lambda I;\\; C]$ confirms $\\lambda_1=+1$ is observable (rank 2) while hidden $\\lambda_2=-3$ is strictly LHP — proving $(A,C)$ is **detectable** and a convergent Kalman Filter exists!',
        prompt:
          'Apply the dual PBH observability test $\\operatorname{rank}\\begin{bmatrix} A - \\lambda I \\\\ C \\end{bmatrix}$ with $C = [1\\; 0]$ to determine whether $(A, C)$ is detectable.',
        highlightLatex:
          '\\text{PBH}_{\\text{obs}}(\\lambda) = \\begin{bmatrix} \\textcolor{#22D3EE}{1-\\lambda} & 0 \\\\ 0 & \\textcolor{#22D3EE}{-3-\\lambda} \\\\ \\textcolor{#F59E0B}{1} & \\textcolor{#F59E0B}{0} \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\text{Completely observable (rank } 2 \\text{ at both } \\lambda_1, \\lambda_2)',
            correct: false,
            misconception:
              'At $\\lambda_2 = -3$, column 2 becomes $[0, 0, 0]^T$, so rank drops to $1$ — mode $x_2$ is invisible to $y = x_1$.',
          },
          {
            id: 'b',
            latex: '\\text{Undetectable: no Kalman filter can converge because } x_2 \\text{ is unmeasured}',
            correct: false,
            misconception:
              'Because the true state $x_2(t) = x_2(0)e^{-3t} \\to 0$ naturally, its estimation error $e_2(t) \\to 0$ exponentially too — that is the exact definition of detectability!',
          },
          {
            id: 'c',
            latex: '\\lambda_1=+1:\\text{ obs (rank }2),\\; \\lambda_2=-3:\\text{ unobs (rank }1,\\text{ LHP)} \\implies (A,C) \\text{ is DETECTABLE}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\lambda_1=+1:\\text{ unobs (rank }1),\\; \\lambda_2=-3:\\text{ obs (rank }2) \\implies \\text{Undetectable}',
            correct: false,
            misconception:
              'With $C = [1, 0]$, the sensor directly measures $x_1$ (the $\\lambda_1 = +1$ mode!), so $\\lambda_1 = +1$ is observable while $\\lambda_2 = -3$ is hidden.',
          },
        ],
        lockedLabel: 'Detectability Verdict',
        lockedResultLatex: '(A,C)\\;\\text{is } \\textcolor{#34D399}{\\text{DETECTABLE}} \\;(\\text{sufficient for Kalman Filter})',
        hint: 'Check which column vanishes at $\\lambda_1 = +1$ vs. $\\lambda_2 = -3$, then check if any unobservable mode is in the RHP.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: FULL-STATE FEEDBACK, POLE PLACEMENT & OPTIMAL LQR (2 problems)
  // =========================================================================
  {
    id: 'ss2-pole-placement-acker',
    tier: 'lqr-optimal',
    tierLabel: 'State Feedback & LQR',
    title: 'Full-State Feedback u = −Kx, Pole Placement & Feedforward N̄',
    mechatronicsContext:
      'Frictionless spacecraft thrusters, magnetic bearings, and direct-drive linear rails behave as pure double integrators ($\\ddot{x} = u$). Full-state feedback shifts both origin poles into an exact critically-tuned Butterworth pair, while DC pre-scaling $\\bar{N}$ eliminates steady-state reference droop.',
    expressionLatex:
      '\\dot{\\mathbf{x}}=\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix}\\mathbf{x}+\\begin{bmatrix}0\\\\1\\end{bmatrix}u, \\quad s_d = -3 \\pm 3j \\;\\;\\longrightarrow\\;\\; K,\\; \\bar{N}',
    finalAnswerLatex:
      'K = \\begin{bmatrix} 18 & 6 \\end{bmatrix}, \\qquad \\bar{N} = 18, \\qquad u = -18x_1 - 6x_2 + 18r',
    diagram: {
      type: 'state-space-loop',
      variant: 'lqr',
      A: '[[0,1],[0,0]]',
      B: '[0,1]ᵀ',
      C: '[1,0]',
      controller: 'u=−Kx+N̄r',
      observer: 'Full State',
      subtitle: 'State Feedback & Feedforward N̄',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -5.5, maxRe: 1.5, minIm: -4.5, maxIm: 4.5 },
      specRegion: { minSigma: 2, maxAngleDeg: 45 },
      poles: [
        { re: -3, im: 3, label: 's₁ = −3 + 3j', status: 'lhp' },
        { re: -3, im: -3, label: 's₂ = −3 − 3j', status: 'lhp' },
      ],
      hudLabel: 'K = [18, 6] · N̄ = 18 · ζ = 0.707 (45° Butterworth Ray)',
      defaultCursor: 0.5,
      subtitle:
        'Full-state feedback $K = [18,\\; 6]$ relocates the unstable double-integrator origin poles ($0, 0$) directly onto the $45^\\circ$ Butterworth damping ray at $s = -3 \\pm 3j$ ($\\zeta = 0.707,\\; T_s \\approx 1.33\\text{ s}$).',
      domainMeta: 'Assigned Closed-Loop Spectrum · A − BK · ζ = 0.707',
      metrics: [
        { label: 'Feedback Gain K', value: '[18, 6]' },
        { label: 'Feedforward N̄', value: '18 (Zero e_ss)' },
        { label: 'CL Poles', value: '−3 ± 3j (ζ=0.707)' },
        { label: 'Settling Time Ts', value: '≈ 4/3 = 1.33 s ✓' },
      ],
    },
    steps: [
      {
        stepType: 'acl_matrix',
        badge: 'Form Closed-Loop Matrix A_cl = A − BK',
        whyThisStep:
          'Substituting the proportional state-feedback law $u = -K\\mathbf{x}$ folds controller gains directly into the plant state matrix, letting you sculpt every closed-loop eigenvalue algebraically.',
        systemImpact:
          'The bottom row of $A - BK = [0, 1;\\; -k_1, -k_2]$ directly adds virtual spring stiffness $k_1$ and virtual viscous damping $k_2$ to a zero-friction inertial plant!',
        prompt:
          'Substitute $u = -K\\mathbf{x} = -[k_1\\;\\; k_2]\\mathbf{x}$ into $\\dot{\\mathbf{x}} = \\begin{bmatrix}0&1\\\\0&0\\end{bmatrix}\\mathbf{x} + \\begin{bmatrix}0\\\\1\\end{bmatrix}u$ to form $A_{\\text{cl}} = A - BK$.',
        highlightLatex:
          'A_{\\text{cl}} = \\textcolor{#22D3EE}{\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix}} - \\textcolor{#22D3EE}{\\begin{bmatrix}0\\\\1\\end{bmatrix}}\\textcolor{#F59E0B}{\\begin{bmatrix}k_1 & k_2\\end{bmatrix}}',
        options: [
          {
            id: 'a',
            latex: 'A_{\\text{cl}} = \\begin{bmatrix} -k_1 & 1 - k_2 \\\\ 0 & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check the outer product $BK = [0;\\; 1][k_1,\\; k_2]$: row 1 is all zeros and row 2 is $[k_1,\\; k_2]$.',
          },
          {
            id: 'b',
            latex: 'A_{\\text{cl}} = \\begin{bmatrix} 0 & 1 \\\\ -k_1 & -k_2 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A_{\\text{cl}} = \\begin{bmatrix} 0 & 1 \\\\ +k_1 & +k_2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Negative feedback $u = -K\\mathbf{x}$ subtracts $BK$ from $A$; positive $+k_1, +k_2$ creates runaway positive feedback!',
          },
          {
            id: 'd',
            latex: 'A_{\\text{cl}} = \\begin{bmatrix} 0 & 1 \\\\ -k_2 & -k_1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Column 1 multiplies $x_1$ (hence $-k_1$) and column 2 multiplies $x_2$ (hence $-k_2$).',
          },
        ],
        lockedLabel: 'Closed-Loop A − BK',
        lockedResultLatex: 'A_{\\text{cl}} = \\textcolor{#34D399}{\\begin{bmatrix}0&1\\\\-k_1&-k_2\\end{bmatrix}}',
        hint: 'Compute the $2\\times 2$ outer product $BK = \\begin{bmatrix}0&0\\\\k_1&k_2\\end{bmatrix}$ and subtract it from $A$.',
      },
      {
        stepType: 'target_poly',
        badge: 'Expand Target Characteristic Polynomial',
        whyThisStep:
          'Translating desired $s$-plane pole coordinates into a monic polynomial lets you read off exact feedback gains by coefficient matching (Ackermann’s formula in companion form).',
        systemImpact:
          'Expanding $(s + 3 - 3j)(s + 3 + 3j) = s^2 + 6s + 18$ encodes $\\omega_n = 3\\sqrt{2}\\approx 4.24\\text{ rad/s}$ and optimal Butterworth damping $\\zeta = 0.707$ (~4.3% step overshoot).',
        prompt:
          'Expand the desired closed-loop characteristic polynomial $p_d(s) = (s - s_1)(s - s_2)$ for target poles $s_{1,2} = -3 \\pm 3j$.',
        highlightLatex:
          'p_d(s) = (s + \\textcolor{#F59E0B}{3} - \\textcolor{#22D3EE}{3j})(s + \\textcolor{#F59E0B}{3} + \\textcolor{#22D3EE}{3j})',
        options: [
          {
            id: 'a',
            latex: 'p_d(s) = s^2 + 6s + 9',
            correct: false,
            misconception:
              'Do not forget the imaginary part squared: $(s+3)^2 - (3j)^2 = (s^2 + 6s + 9) + 9 = s^2 + 6s + 18$!',
          },
          {
            id: 'b',
            latex: 'p_d(s) = s^2 - 6s + 18',
            correct: false,
            misconception:
              'For LHP poles $s = -3 \\pm 3j$, the factor is $(s - (-3 \\pm 3j)) = (s + 3 \\mp 3j)$, giving $+6s$.',
          },
          {
            id: 'c',
            latex: 'p_d(s) = s^2 + 6s + 18',
            correct: true,
          },
          {
            id: 'd',
            latex: 'p_d(s) = s^2 + 3s + 18',
            correct: false,
            misconception:
              'The middle coefficient is $2\\sigma = 2(3) = 6$, not $3$.',
          },
        ],
        lockedLabel: 'Target Polynomial',
        lockedResultLatex: 'p_d(s) = \\textcolor{#34D399}{s^2 + 6s + 18}',
        hint: 'Use $(a - jb)(a + jb) = a^2 + b^2$ with $a = s + 3$ and $b = 3$.',
      },
      {
        stepType: 'solve_gain_k',
        badge: 'Match Coefficients to Solve K',
        whyThisStep:
          'Equating $\\det(sI - (A-BK))$ to $p_d(s)$ uniquely determines the state-feedback vector $K$ for any controllable single-input plant.',
        systemImpact:
          'Setting $K = [18,\\; 6]$ injects $18\\text{ N/m}$ of virtual stiffness on position $x_1$ and $6\\text{ N}\\cdot\\text{s/m}$ of virtual damping on velocity $x_2$.',
        prompt:
          'Evaluate $\\det(sI - A_{\\text{cl}})$ and equate coefficients with $p_d(s) = s^2 + 6s + 18$ to find $K = [k_1\\;\\; k_2]$.',
        highlightLatex:
          '\\det\\begin{bmatrix} s & -1 \\\\ \\textcolor{#F59E0B}{k_1} & s + \\textcolor{#F59E0B}{k_2} \\end{bmatrix} = s^2 + k_2 s + k_1 \\equiv s^2 + \\textcolor{#34D399}{6}s + \\textcolor{#34D399}{18}',
        options: [
          {
            id: 'a',
            latex: 'K = \\begin{bmatrix} 6 & 18 \\end{bmatrix}',
            correct: false,
            misconception:
              'Classic ordering swap! In $s^2 + k_2 s + k_1$, $k_1$ matches the constant term $18$ (position gain) and $k_2$ matches the $s$-coefficient $6$ (velocity damping).',
          },
          {
            id: 'b',
            latex: 'K = \\begin{bmatrix} -18 & -6 \\end{bmatrix}',
            correct: false,
            misconception:
              'The minus sign is already built into the control law $u = -K\\mathbf{x}$; both entries of $K$ are positive.',
          },
          {
            id: 'c',
            latex: 'K = \\begin{bmatrix} 18 & 6 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'K = \\begin{bmatrix} 9 & 6 \\end{bmatrix}',
            correct: false,
            misconception:
              'Re-check the constant term of $p_d(s)$: $3^2 + 3^2 = 18$, so $k_1 = 18$.',
          },
        ],
        lockedLabel: 'State Feedback Gain K',
        lockedResultLatex: 'K = \\textcolor{#34D399}{\\begin{bmatrix} 18 & 6 \\end{bmatrix}}',
        hint: 'Match $s^1$: $k_2 = 6$; match $s^0$: $k_1 = 18$.',
      },
      {
        stepType: 'feedforward_nbar',
        badge: 'Solve DC Reference Feedforward Gain N̄',
        whyThisStep:
          'Pure state regulation $u = -K\\mathbf{x}$ drives states to zero; adding a reference $r$ via $u = -K\\mathbf{x} + \\bar{N}r$ without scaling $\\bar{N}$ leaves massive steady-state tracking droop ($y_{\\text{ss}} = r/18$!).',
        systemImpact:
          'Computing $\\bar{N} = [-C(A-BK)^{-1}B]^{-1} = 18$ scales the DC loop gain to exact unity ($y_{\\text{ss}} = r$), while leaving the closed-loop poles at $-3 \\pm 3j$ completely untouched!',
        prompt:
          'For $u = -K\\mathbf{x} + \\bar{N}r$ with $C = [1\\; 0]$, compute the exact pre-compensation gain $\\bar{N} = \\big[-C(A-BK)^{-1}B\\big]^{-1}$ so $y_{\\text{ss}} = r$.',
        highlightLatex:
          '0 = \\textcolor{#22D3EE}{(A-BK)}\\mathbf{x}_{\\text{ss}} + B\\textcolor{#F59E0B}{\\bar{N}}r \\implies y_{\\text{ss}} = -C(A-BK)^{-1}B\\,\\textcolor{#F59E0B}{\\bar{N}}r = r',
        options: [
          {
            id: 'a',
            latex: '\\bar{N} = 1',
            correct: false,
            misconception:
              'Setting $\\bar{N} = 1$ yields $\\ddot{x} + 6\\dot{x} + 18x = r \\implies x_{\\text{ss}} = r/18$ (94.4% steady-state error!).',
          },
          {
            id: 'b',
            latex: '\\bar{N} = \\frac{1}{18}',
            correct: false,
            misconception:
              '$-C(A-BK)^{-1}B = 1/18$ is the unscaled DC gain; $\\bar{N}$ is its RECIPROCAL so that $(1/18)\\bar{N} = 1$.',
          },
          {
            id: 'c',
            latex: '\\bar{N} = 6',
            correct: false,
            misconception:
              'At DC steady state ($\\dot{x} = \\ddot{x} = 0$), the velocity damping term $6\\dot{x}$ vanishes — only the stiffness term $18x_{\\text{ss}} = \\bar{N}r$ remains!',
          },
          {
            id: 'd',
            latex: '\\bar{N} = 18 \\qquad (u = -18x_1 - 6x_2 + 18r)',
            correct: true,
          },
        ],
        lockedLabel: 'Feedforward Gain N̄',
        lockedResultLatex: '\\bar{N} = \\textcolor{#34D399}{18} \\implies y_{\\text{ss}} = r',
        hint: 'In steady state $\\dot{x}_1 = \\dot{x}_2 = 0$, the second equation is $-18x_1 + \\bar{N}r = 0$.',
      },
      {
        stepType: 'pole_vs_lqr_modern',
        badge: 'Why LQR Supersedes Pole Placement in MIMO Robotics',
        whyThisStep:
          'Ackermann / pole placement works cleanly on 2-state SISO textbook plants, but knowing its structural breakdown on 12-DOF quadrupeds and drones explains why modern robotics defaults to LQR and MPC.',
        systemImpact:
          'Manual pole placement ignores actuator energy limits, leaves MIMO eigenvector directions arbitrary, and offers ZERO robustness guarantees — whereas LQR trades state error against torque directly with guaranteed $\\ge 60^\\circ$ phase margin!',
        prompt:
          'Why is manual pole placement (`place` / Ackermann) largely superseded by optimal LQR/MPC in high-DOF MIMO mechatronic and robotic systems?',
        highlightLatex:
          '\\text{MIMO } (n \\gg 2,\\; m > 1): \\quad \\text{Pole Placement } (s_1,\\dots,s_n) \\;\\text{ vs. }\\; \\text{LQR } \\min \\int (\\mathbf{x}^T Q\\mathbf{x} + \\mathbf{u}^T R\\mathbf{u})\\,dt',
        options: [
          {
            id: 'a',
            latex: '\\text{Pole placement cannot stabilize open-loop unstable plants like inverted pendulums}',
            correct: false,
            misconception:
              'Pole placement CAN stabilize any controllable unstable plant — its weakness is NOT stability, but actuator blow-up, non-unique MIMO gains, and lack of margin guarantees.',
          },
          {
            id: 'b',
            latex: '\\text{Arbitrary pole targets ignore actuator energy/saturation, leave MIMO eigenvectors under-specified, and give no guaranteed robustness margins}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Pole placement requires nonlinear optimization at every sample step, making it too slow for microcontrollers}',
            correct: false,
            misconception:
              'Both pole placement and infinite-horizon LQR produce a constant offline matrix $K$ ($u = -K\\mathbf{x}$ is just a fast dot product at runtime!).',
          },
          {
            id: 'd',
            latex: '\\text{Ackermann’s formula works for MIMO systems automatically without any design choices}',
            correct: false,
            misconception:
              'Ackermann’s formula is strictly single-input ($m = 1$)! For MIMO ($m > 1$), infinitely many gain matrices $K$ yield the exact same eigenvalues with wildly different control effort and sensitivity.',
          },
        ],
        lockedLabel: 'Modern Engineering Insight',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{LQR optimizes } (Q,R)\\text{ effort, solves MIMO uniquely \\& guarantees } \\ge 60^\\circ\\text{ PM}}',
        hint: 'Think about what happens when you arbitrarily ask a 12-DOF robot for fast poles without penalizing motor torque or checking robustness.',
      },
    ],
  },

  {
    id: 'ss2-lqr-riccati',
    tier: 'lqr-optimal',
    tierLabel: 'State Feedback & LQR',
    title: 'LQR Cost (Q,R), Exact Riccati (CARE), Guaranteed Margins & iLQR/DDP',
    mechatronicsContext:
      'Linear Quadratic Regulators (LQR) are the backbone of rocket landing, quadrotor hovering, and balancing robots. Solving the Continuous Algebraic Riccati Equation analytically on a double integrator exposes why LQR naturally births optimal Butterworth damping, guaranteed 60° phase margin, and nonlinear iLQR/DDP trajectory optimizers.',
    expressionLatex:
      'A=\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; Q=\\begin{bmatrix}1&0\\\\0&0\\end{bmatrix},\\; R=1 \\;\\;\\longrightarrow\\;\\; P,\\; K_{\\text{LQR}}',
    finalAnswerLatex:
      'P=\\begin{bmatrix}\\sqrt{2}&1\\\\1&\\sqrt{2}\\end{bmatrix}, \\quad K=\\begin{bmatrix}1 & \\sqrt{2}\\end{bmatrix}, \\quad \\zeta=\\frac{1}{\\sqrt{2}}, \\quad \\text{PM}\\ge 60^\\circ,\\; \\text{GM}\\in[\\tfrac{1}{2},\\infty)',
    diagram: {
      type: 'state-space-loop',
      variant: 'lqr',
      A: '[[0,1],[0,0]]',
      B: '[0,1]ᵀ',
      C: 'I₂',
      controller: 'K=R⁻¹BᵀP',
      observer: 'CARE (Q,R)',
      subtitle: 'Optimal LQR & Riccati Feedback',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -2.4, maxRe: 0.8, minIm: -1.6, maxIm: 1.6 },
      specRegion: { minSigma: 0.5, maxAngleDeg: 45 },
      poles: [
        { re: -Math.SQRT1_2, im: Math.SQRT1_2, label: '−0.707 + 0.707j', status: 'lhp' },
        { re: -Math.SQRT1_2, im: -Math.SQRT1_2, label: '−0.707 − 0.707j', status: 'lhp' },
      ],
      hudLabel: 'K = [1, √2] · Exact Butterworth ζ = 0.707 · PM ≥ 60°',
      defaultCursor: 0.5,
      subtitle:
        'Solving CARE for $Q = \\operatorname{diag}(1,0),\\; R=1$ automatically lands the closed-loop poles at $s = -\\frac{\\sqrt{2}}{2} \\pm j\\frac{\\sqrt{2}}{2}$ right on the $45^\\circ$ Butterworth ray with guaranteed $\\ge 60^\\circ$ phase margin!',
      domainMeta: 'LQR Optimal Spectrum · CARE Solution · PM ≥ 60°, GM ∈ [½, ∞)',
      metrics: [
        { label: 'Riccati P', value: '[[√2, 1], [1, √2]]' },
        { label: 'Optimal Gain K', value: '[1, √2]' },
        { label: 'CL Damping ζ', value: '1/√2 ≈ 0.707' },
        { label: 'LQR Margins', value: 'PM ≥ 60°, GM ≥ ½ ✓' },
      ],
    },
    steps: [
      {
        stepType: 'lqr_cost_setup',
        badge: 'Formulate LQR Quadratic Cost (Q, R)',
        whyThisStep:
          'LQR turns engineering specifications ("tight position tracking without burning out the motor") into convex matrix weights $(Q, R)$ whose definiteness guarantees a unique, finite, stabilizing optimal controller.',
        systemImpact:
          'Here $Q = \\operatorname{diag}(1, 0) \\succeq 0$ penalizes position squared ($x_1^2$) while $(A, Q^{1/2})$ remains detectable, and $R = 1 \\succ 0$ ensures $R^{-1}$ exists so control torque stays finite!',
        prompt:
          'Write the infinite-horizon LQR objective $J$ and identify the required definiteness conditions on $Q$ and $R$ for a unique stabilizing controller.',
        highlightLatex:
          'J = \\int_0^\\infty \\big(\\mathbf{x}^T \\textcolor{#F59E0B}{Q}\\,\\mathbf{x} + u^T \\textcolor{#F59E0B}{R}\\,u\\big)\\,dt, \\qquad Q=\\begin{bmatrix}1&0\\\\0&0\\end{bmatrix},\\; R=1',
        options: [
          {
            id: 'a',
            latex: 'Q = Q^T \\succeq 0\\;(\\text{PSD, }(A,Q^{1/2})\\text{ detectable}), \\qquad R = R^T \\succ 0\\;(\\text{strictly PD})',
            correct: true,
          },
          {
            id: 'b',
            latex: 'Q \\succ 0\\;(\\text{must be strictly PD}), \\qquad R \\succeq 0\\;(\\text{can be zero})',
            correct: false,
            misconception:
              'Inverted! Setting $R = 0$ makes $R^{-1}$ explode (infinite impulse control), whereas $Q$ CAN be semidefinite (zero penalty on velocity $x_2$) as long as $(A, Q^{1/2})$ is detectable!',
          },
          {
            id: 'c',
            latex: 'Q \\prec 0 \\text{ and } R \\prec 0 \\text{ so the cost decreases toward } -\\infty',
            correct: false,
            misconception:
              'Negative weights reward blowing the state and actuator to infinity! Both $Q$ and $R$ must be non-negative definite (and $R$ strictly positive definite).',
          },
          {
            id: 'd',
            latex: 'Q \\text{ and } R \\text{ must be diagonal with identical entries } Q = R = I',
            correct: false,
            misconception:
              'Bryson’s rule often starts with diagonal weights, but any symmetric $Q \\succeq 0$ and $R \\succ 0$ (even with cross-coupled off-diagonals) is completely valid.',
          },
        ],
        lockedLabel: 'LQR Cost Weights',
        lockedResultLatex: '\\textcolor{#34D399}{Q = Q^T \\succeq 0, \\quad R = R^T \\succ 0 \\;(\\text{well-posed})}',
        hint: 'Notice $Q = \\operatorname{diag}(1,0)$ has a zero eigenvalue (PSD), while $R^{-1}$ appears explicitly in the optimal gain formula.',
      },
      {
        stepType: 'care_equation',
        badge: 'Write the Continuous Algebraic Riccati Equation',
        whyThisStep:
          'Dynamic programming (Hamilton-Jacobi-Bellman) reduces the infinite-horizon optimal control problem to a quadratic matrix equation (CARE) for the cost-to-go Hessian $P$ ($V^*(\\mathbf{x}) = \\mathbf{x}^T P \\mathbf{x}$).',
        systemImpact:
          'Solving $A^T P + PA - PBR^{-1}B^T P + Q = 0$ for the unique symmetric $P \\succ 0$ simultaneously proves closed-loop stability (via Lyapunov function $V = \\mathbf{x}^T P \\mathbf{x}$) and delivers the exact optimal feedback gain.',
        prompt:
          'Select the exact Continuous Algebraic Riccati Equation (CARE) satisfied by the optimal cost-to-go matrix $P = P^T \\succ 0$.',
        highlightLatex:
          'V^*(\\mathbf{x}) = \\mathbf{x}^T \\textcolor{#22D3EE}{P}\\,\\mathbf{x} \\implies \\min_u \\big[\\dot{V}^* + \\mathbf{x}^T Q\\mathbf{x} + u^T R u\\big] = 0',
        options: [
          {
            id: 'a',
            latex: 'A^T P + PA + PBR^{-1}B^T P + Q = 0',
            correct: false,
            misconception:
              'Watch the sign on the quadratic Riccati term! Completing the square in $u$ produces $-PBR^{-1}B^T P$ (minus, representing cost reduction from active control).',
          },
          {
            id: 'b',
            latex: 'A^T P + PA - PBR^{-1}B^T P + Q = 0',
            correct: true,
          },
          {
            id: 'c',
            latex: 'AP + PA^T - PC^T R^{-1} C P + Q = 0',
            correct: false,
            misconception:
              'That is the DUAL Kalman-Bucy filter Riccati equation (using $A, C$ instead of $A^T, B$)! Controller LQR uses $A^T P + PA - PBR^{-1}B^T P + Q = 0$.',
          },
          {
            id: 'd',
            latex: 'A^T P + PA + Q = 0',
            correct: false,
            misconception:
              'That is the linear Lyapunov equation for an UNCONTROLLED stable plant ($B = 0$), which has no solution for an unstable double integrator!',
          },
        ],
        lockedLabel: 'CARE Identity',
        lockedResultLatex: '\\textcolor{#34D399}{A^T P + PA - PBR^{-1}B^T P + Q = 0}',
        hint: 'Controller CARE starts with $A^T P + PA$, subtracts $PBR^{-1}B^T P$, and adds $+Q = 0$.',
      },
      {
        stepType: 'solve_care_p',
        badge: 'Solve CARE Analytically for P ≻ 0',
        whyThisStep:
          'Working through a $2\\times 2$ CARE by hand demystifies what `lqr(A,B,Q,R)` computes under the hood and reveals why the positive-definite root $P \\succ 0$ is selected over destabilizing roots.',
        systemImpact:
          'Enforcing $P \\succ 0$ uniquely selects $p_{12} = +1$, $p_{22} = \\sqrt{2}$, and $p_{11} = \\sqrt{2}$ (check: $\\det(P) = 2 - 1 = 1 > 0$), giving the exact optimal value function $V^*(\\mathbf{x}) = \\sqrt{2}x_1^2 + 2x_1 x_2 + \\sqrt{2}x_2^2$.',
        prompt:
          'Substitute symmetric $P = \\begin{bmatrix}p_{11}&p_{12}\\\\p_{12}&p_{22}\\end{bmatrix}$ into $A^T P + PA - PBR^{-1}B^T P + Q = 0$ with $A=\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; Q=\\begin{bmatrix}1&0\\\\0&0\\end{bmatrix},\\; R=1$ and solve for $P \\succ 0$.',
        highlightLatex:
          '\\begin{bmatrix}0 & p_{11} \\\\ p_{11} & 2p_{12}\\end{bmatrix} - \\begin{bmatrix}p_{12}^2 & p_{12}p_{22} \\\\ p_{12}p_{22} & p_{22}^2\\end{bmatrix} + \\begin{bmatrix}\\textcolor{#F59E0B}{1} & 0 \\\\ 0 & 0\\end{bmatrix} = 0',
        options: [
          {
            id: 'a',
            latex: 'P = \\begin{bmatrix} 1 & 1 \\\\ 1 & 2 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check entry $(2,2)$: $2p_{12} - p_{22}^2 = 0 \\implies 2(1) = p_{22}^2 \\implies p_{22} = \\sqrt{2}$, not $2$!',
          },
          {
            id: 'b',
            latex: 'P = \\begin{bmatrix} -\\sqrt{2} & 1 \\\\ 1 & -\\sqrt{2} \\end{bmatrix}',
            correct: false,
            misconception:
              'A negative diagonal violates $P \\succ 0$ (positive-definite cost-to-go)! Choose the positive root $p_{22} = +\\sqrt{2}$, which forces $p_{11} = +\\sqrt{2}$.',
          },
          {
            id: 'c',
            latex: 'P = \\begin{bmatrix} \\sqrt{2} & 1 \\\\ 1 & \\sqrt{2} \\end{bmatrix} \\quad (\\det P = 1 > 0)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'P = \\begin{bmatrix} 2 & 1 \\\\ 1 & \\sqrt{2} \\end{bmatrix}',
            correct: false,
            misconception:
              'Check entry $(1,2)$: $p_{11} - p_{12}p_{22} = 0 \\implies p_{11} = (1)(\\sqrt{2}) = \\sqrt{2}$, not $2$.',
          },
        ],
        lockedLabel: 'Riccati Solution P',
        lockedResultLatex: 'P = \\textcolor{#34D399}{\\begin{bmatrix}\\sqrt{2} & 1 \\\\ 1 & \\sqrt{2}\\end{bmatrix}} \\succ 0',
        hint: 'Solve sequentially: $(1,1) \\implies p_{12}=1$, then $(2,2) \\implies p_{22}=\\sqrt{2}$, then $(1,2) \\implies p_{11}=p_{12}p_{22}$.',
      },
      {
        stepType: 'lqr_gain_k',
        badge: 'Compute Optimal Feedback Gain K = R⁻¹BᵀP',
        whyThisStep:
          'Setting $\\frac{\\partial}{\\partial u}(\\dot{V}^* + u^T R u) = 0$ produces the exact linear feedback law $u^* = -R^{-1}B^T P\\,\\mathbf{x}$, linking control weight $R$ directly to the Riccati solution $P$.',
        systemImpact:
          'Evaluating $K = R^{-1}B^T P = [1,\\; \\sqrt{2}]$ shows that even though $Q$ put ZERO weight on velocity $x_2$, LQR automatically synthesizes velocity damping $\\sqrt{2}x_2$ to minimize future position energy!',
        prompt:
          'Compute the optimal LQR gain vector $K = R^{-1}B^T P$ using $R = 1$, $B = [0,\\; 1]^T$, and $P = \\begin{bmatrix}\\sqrt{2}&1\\\\1&\\sqrt{2}\\end{bmatrix}$.',
        highlightLatex:
          'K = \\textcolor{#F59E0B}{R^{-1}} \\textcolor{#22D3EE}{B^T} \\textcolor{#34D399}{P} = (1)^{-1}\\begin{bmatrix}0 & 1\\end{bmatrix}\\begin{bmatrix}\\sqrt{2} & 1 \\\\ 1 & \\sqrt{2}\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'K = \\begin{bmatrix} \\sqrt{2} & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Left-multiplying $P$ by $B^T = [0,\\; 1]$ selects the SECOND row of $P$, which is $[1,\\; \\sqrt{2}]$, not the first row $[\\sqrt{2},\\; 1]$!',
          },
          {
            id: 'b',
            latex: 'K = \\begin{bmatrix} 1 & \\sqrt{2} \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K = \\begin{bmatrix} 1 & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'Remember $K = R^{-1}B^T P$, NOT $R^{-1}B^T Q$! Zero velocity gain would leave an undamped oscillator $s = \\pm j$.',
          },
          {
            id: 'd',
            latex: 'K = \\begin{bmatrix} 1 \\\\ \\sqrt{2} \\end{bmatrix}',
            correct: false,
            misconception:
              'Check matrix dimensions: $u = -K\\mathbf{x}$ maps $\\mathbb{R}^2 \\to \\mathbb{R}^1$, so $K$ must be a $1\\times 2$ ROW vector $[1,\\; \\sqrt{2}]$.',
          },
        ],
        lockedLabel: 'Optimal LQR Gain',
        lockedResultLatex: 'K_{\\text{LQR}} = \\textcolor{#34D399}{\\begin{bmatrix} 1 & \\sqrt{2} \\end{bmatrix}}',
        hint: '$B^T = [0,\\; 1]$ extracts the bottom row of $P$.',
      },
      {
        stepType: 'lqr_butterworth_margins',
        badge: 'Verify Butterworth Poles & Guaranteed LQR Margins',
        whyThisStep:
          'Full-state LQR obeys the Kalman return-difference inequality $|1 + L(j\\omega)| \\ge 1$ for all $\\omega$, delivering unmatched robustness margins automatically for ANY stabilizable linear plant.',
        systemImpact:
          'The closed-loop poles $s^2 + \\sqrt{2}s + 1 = 0$ have exact Butterworth damping $\\zeta = 1/\\sqrt{2} \\approx 0.707$, and full-state LQR universally guarantees Phase Margin $\\ge 60^\\circ$ and Gain Margin $\\in [\\tfrac{1}{2}, \\infty)$!',
        prompt:
          'Find the closed-loop damping ratio $\\zeta$ of $A - BK$ and state Kalman’s universal guaranteed stability margins for full-state LQR.',
        highlightLatex:
          '\\det(sI - (A-BK)) = s^2 + \\textcolor{#34D399}{\\sqrt{2}}s + \\textcolor{#34D399}{1} = 0, \\qquad |1 + L_{\\text{LQR}}(j\\omega)| \\ge 1',
        options: [
          {
            id: 'a',
            latex: '\\zeta = \\frac{1}{\\sqrt{2}} \\approx 0.707\\;(\\text{Butterworth}); \\quad \\text{PM} \\ge 60^\\circ,\\; \\text{GM} \\in \\left[\\tfrac{1}{2},\\, \\infty\\right)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\zeta = \\sqrt{2} \\approx 1.414\\;(\\text{overdamped}); \\quad \\text{PM} \\ge 45^\\circ,\\; \\text{GM} \\in [1, 2]',
            correct: false,
            misconception:
              'Watch the factor of $2$ in $2\\zeta\\omega_n = \\sqrt{2}$ with $\\omega_n = 1$: $\\zeta = \\frac{\\sqrt{2}}{2} = \\frac{1}{\\sqrt{2}}$, and LQR’s guaranteed margins are $\\text{PM} \\ge 60^\\circ$ and $\\text{GM} \\in [\\tfrac{1}{2}, \\infty)$!',
          },
          {
            id: 'c',
            latex: '\\zeta = 0.5; \\quad \\text{LQR has no guaranteed phase or gain margins}',
            correct: false,
            misconception:
              'You are thinking of LQG (LQR + observer)! Full-state LQR ALWAYS guarantees $\\ge 60^\\circ$ phase margin, infinite upward gain margin, and $50\\%$ downward gain reduction margin.',
          },
          {
            id: 'd',
            latex: '\\zeta = 0.707; \\quad \\text{PM} \\ge 90^\\circ,\\; \\text{GM} \\in (0, \\infty)',
            correct: false,
            misconception:
              'The Nyquist curve stays outside the unit circle centered at $-1 + j0$: a circle of radius $1$ centered at $-1$ intersects the unit circle around $0$ at $\\pm 60^\\circ$ (not $90^\\circ$) and touches $-0.5$ on the real axis (giving downward GM $= 1/2$).',
          },
        ],
        lockedLabel: 'Butterworth & Margins',
        lockedResultLatex: '\\zeta = \\textcolor{#34D399}{\\frac{1}{\\sqrt{2}}}, \\quad \\text{PM} \\ge \\textcolor{#34D399}{60^\\circ}, \\quad \\text{GM} \\in \\textcolor{#34D399}{[\\tfrac{1}{2}, \\infty)}',
        hint: 'Solve $2\\zeta(1) = \\sqrt{2}$, and recall the unit-circle exclusion zone around $-1+j0$ yields $\\cos(\\text{PM}) = 1/2 \\implies 60^\\circ$.',
      },
      {
        stepType: 'ilqr_ddp_upgrade',
        badge: 'Modern Nonlinear Robotics Upgrade: iLQR / DDP',
        whyThisStep:
          'Static LQR only holds near one equilibrium point — understanding how **iterative LQR (iLQR)** and **Differential Dynamic Programming (DDP)** generalize Riccati sweeps explains how modern humanoids and quadrupeds execute dynamic agile maneuvers.',
        systemImpact:
          'By linearizing $\\dot{\\mathbf{x}} = f(\\mathbf{x}, \\mathbf{u})$ along a full nominal trajectory and running backward discrete Riccati recursions, **iLQR / DDP** outputs both optimal feedforward trajectories and locally stabilizing time-varying feedback gains $K_k$!',
        prompt:
          'How do modern nonlinear trajectory optimizers (**iLQR / DDP**) extend classical LQR to agile, strongly nonlinear robots (quadruped backflips, rocket landing, robot arms)?',
        highlightLatex:
          '\\mathbf{x}_{k+1} = f(\\mathbf{x}_k, \\mathbf{u}_k) \\;\\xrightarrow{\\text{Backward Riccati}}\\quad \\mathbf{u}_k^* = \\bar{\\mathbf{u}}_k + \\textcolor{#34D399}{\\mathbf{k}_k} - \\textcolor{#34D399}{K_k}(\\mathbf{x}_k - \\bar{\\mathbf{x}}_k)',
        options: [
          {
            id: 'a',
            latex: '\\text{They linearize once at } \\mathbf{x}=0 \\text{ and increase } Q \\text{ until nonlinearities vanish}',
            correct: false,
            misconception:
              'A single equilibrium linearization fails catastrophically across large angle swings (e.g., swing-up or jumping), and cranking $Q$ saturates actuators.',
          },
          {
            id: 'b',
            latex: '\\text{They iteratively linearize } f(\\mathbf{x},\\mathbf{u}) \\text{ along the trajectory, run a backward Riccati sweep for } (\\mathbf{k}_k, K_k), \\text{ and roll out a forward pass}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{They replace Riccati equations entirely with random grid search over policy weights}',
            correct: false,
            misconception:
              'iLQR and DDP exploit exact second-order Bellman optimality via backward Riccati recursions ($O(N n^3)$ per iteration), converging orders of magnitude faster than grid search.',
          },
          {
            id: 'd',
            latex: '\\text{They compute open-loop torques only, with zero feedback stabilization along the path}',
            correct: false,
            misconception:
              'A huge advantage of iLQR/DDP is that the backward pass automatically produces a time-varying feedback gain matrix $K_k$ at every knot point to reject disturbances!',
          },
        ],
        lockedLabel: 'Nonlinear SOTA (iLQR)',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{iLQR / DDP: iterative trajectory linearization + backward Riccati sweep } (\\mathbf{k}_k, K_k)}',
        hint: 'Think of iLQR as running finite-horizon time-varying LQR backward along a rolling nonlinear trajectory, then updating the rollout forward.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: RECEDING-HORIZON MPC & SAFETY-CRITICAL CBF-QP (2 problems)
  // =========================================================================
  {
    id: 'ss3-mpc-qp-horizon',
    tier: 'mpc-cbf',
    tierLabel: 'MPC & CBF-QP Safety',
    title: 'Discrete-Time MPC: Prediction Matrices, Condensed QP & Receding Horizon',
    mechatronicsContext:
      'Every real actuator hits hard torque, current, and joint-angle limits where unconstrained LQR suffers integrator windup and overshoot. Model Predictive Control (MPC) rolls the discrete plant forward over a prediction horizon, packs cost and hard constraints into a fast convex Quadratic Program (QP), and re-solves every millisecond.',
    expressionLatex:
      '\\mathbf{x}_{k+1}=\\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}\\mathbf{x}_k+\\begin{bmatrix}0.5\\\\1\\end{bmatrix}u_k, \\quad |u_k|\\le 1,\\; N=2 \\;\\;\\longrightarrow\\;\\; \\text{Condensed QP}',
    finalAnswerLatex:
      '\\Gamma=\\begin{bmatrix}0.5&0\\\\1&0\\\\1.5&0.5\\\\1&1\\end{bmatrix}, \\quad H=2(\\Gamma^T\\bar{Q}\\Gamma+\\bar{R})\\succ 0, \\quad \\text{Apply } u_0^* \\text{ only},\\; P_f = P_{\\text{DARE}}',
    diagram: {
      type: 'mpc-cbf',
      variant: 'mpc',
      horizon: 'N=2',
      constraint: '|u|≤1',
      barrier: 'x∈𝒳_f',
      cost: 'xᵀQx+uᵀRu',
      subtitle: 'Receding-Horizon Condensed QP',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 6.0],
      setpoint: 1.0,
      setpointLabel: 'Target Position r = 1.0',
      primaryLabel: 'Constrained MPC (|u|≤1)',
      baselineLabel: 'Clipped Aggressive LQR',
      primaryFn: (t) => 1 - (1 + 1.15 * t) * Math.exp(-1.15 * t),
      baselineFn: (t) =>
        1 - Math.exp(-0.62 * t) * (Math.cos(1.65 * t) + 0.375 * Math.sin(1.65 * t)),
      tsMarker: { t: 3.9, label: 'MPC Settled', band: 0.02 },
      defaultCursor: 0.35,
      subtitle:
        'Hover across time $t$ to compare constraint-aware MPC (Emerald, smoothly braking ahead of $|u|\\le 1$) against an unconstrained aggressive LQR gain clipped at $|u|=1$ (Cyan dashed, overshooting because it failed to anticipate braking torque saturation).',
      domainMeta: 'Actuator-Constrained Step · MPC QP vs Clipped LQR · |u| ≤ 1',
      metrics: [
        { label: 'Horizon', value: 'N = 2 (Receding)' },
        { label: 'Input Limit', value: '|u_k| ≤ 1 (Hard QP)' },
        { label: 'Hessian H', value: '2(ΓᵀQ̄Γ + R̄) ≻ 0' },
        { label: 'Terminal Cost', value: 'P_f = P_DARE ✓' },
      ],
    },
    steps: [
      {
        stepType: 'mpc_unroll',
        badge: 'Unroll 2-Step Prediction X = Φx₀ + ΓU',
        whyThisStep:
          'Eliminating intermediate states expresses every future state over the horizon strictly as an affine function of the current measurement $\\mathbf{x}_0$ and the planned control sequence $U = [u_0, u_1]^T$.',
        systemImpact:
          'The lower block-triangular structure of $\\Gamma$ enforces strict causality: $u_0$ steers both $\\mathbf{x}_1$ and $\\mathbf{x}_2$, while $u_1$ cannot retroactively alter $\\mathbf{x}_1$!',
        prompt:
          'Unroll $\\mathbf{x}_{k+1} = A_d \\mathbf{x}_k + B_d u_k$ for $k = 0, 1$ ($N = 2$) into the stacked prediction $X = \\begin{bmatrix}\\mathbf{x}_1 \\\\ \\mathbf{x}_2\\end{bmatrix} = \\Phi \\mathbf{x}_0 + \\Gamma \\begin{bmatrix}u_0 \\\\ u_1\\end{bmatrix}$.',
        highlightLatex:
          '\\mathbf{x}_1 = \\textcolor{#22D3EE}{A_d}\\mathbf{x}_0 + \\textcolor{#F59E0B}{B_d}u_0, \\qquad \\mathbf{x}_2 = A_d\\mathbf{x}_1 + B_d u_1',
        options: [
          {
            id: 'a',
            latex: '\\Phi = \\begin{bmatrix} A_d \\\\ A_d^2 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} B_d & 0 \\\\ A_d B_d & B_d \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\Phi = \\begin{bmatrix} A_d \\\\ 2A_d \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} B_d & 0 \\\\ B_d & B_d \\end{bmatrix}',
            correct: false,
            misconception:
              'State transition multiplies recursively ($A_d(A_d \\mathbf{x}_0 + B_d u_0) = A_d^2 \\mathbf{x}_0 + A_d B_d u_0$), not additively!',
          },
          {
            id: 'c',
            latex: '\\Phi = \\begin{bmatrix} A_d \\\\ A_d^2 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} B_d & A_d B_d \\\\ 0 & B_d \\end{bmatrix}',
            correct: false,
            misconception:
              'Putting $A_d B_d$ in the top-right entry violates causality — future input $u_1$ cannot affect past state $\\mathbf{x}_1$!',
          },
          {
            id: 'd',
            latex: '\\Phi = \\begin{bmatrix} I \\\\ A_d \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} 0 & 0 \\\\ B_d & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'That stacks $[\\mathbf{x}_0;\\; \\mathbf{x}_1]$ instead of the predicted states $[\\mathbf{x}_1;\\; \\mathbf{x}_2]$, leaving $u_1$ completely unused.',
          },
        ],
        lockedLabel: 'Prediction Matrices',
        lockedResultLatex: '\\Phi = \\textcolor{#34D399}{\\begin{bmatrix}A_d \\\\ A_d^2\\end{bmatrix}}, \\quad \\Gamma = \\textcolor{#34D399}{\\begin{bmatrix}B_d & 0 \\\\ A_d B_d & B_d\\end{bmatrix}}',
        hint: 'Substitute $\\mathbf{x}_1 = A_d\\mathbf{x}_0 + B_d u_0$ directly into $\\mathbf{x}_2 = A_d\\mathbf{x}_1 + B_d u_1$.',
      },
      {
        stepType: 'mpc_gamma_numeric',
        badge: 'Compute Exact Numerical Prediction Matrix Γ',
        whyThisStep:
          'Evaluating the impulse-response columns $A_d^j B_d$ reveals the exact physical reachability of the discrete double integrator: an acceleration pulse at $k=0$ keeps drifting position forward at $k=2$!',
        systemImpact:
          'Computing $A_d B_d = [1.5,\\; 1]^T$ quantifies coasting momentum: $u_0$ moves $\\mathbf{x}_2$’s position by $1.5\\,u_0$ (triple the $0.5\\,u_0$ single-step shift), explaining why MPC starts braking early!',
        prompt:
          'For $A_d = \\begin{bmatrix}1 & 1 \\\\ 0 & 1\\end{bmatrix}$ and $B_d = \\begin{bmatrix}0.5 \\\\ 1\\end{bmatrix}$, evaluate $A_d B_d$ and assemble the full $4 \\times 2$ matrix $\\Gamma$.',
        highlightLatex:
          'A_d B_d = \\textcolor{#22D3EE}{\\begin{bmatrix}1 & 1 \\\\ 0 & 1\\end{bmatrix}}\\textcolor{#F59E0B}{\\begin{bmatrix}0.5 \\\\ 1\\end{bmatrix}}, \\qquad \\Gamma = \\begin{bmatrix} B_d & 0 \\\\ A_d B_d & B_d \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'A_d B_d = \\begin{bmatrix} 0.5 \\\\ 1 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} 0.5 & 0 \\\\ 1 & 0 \\\\ 0.5 & 0.5 \\\\ 1 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Multiply row 1 of $A_d$ by $B_d$: $1(0.5) + 1(1) = 1.5$, not $0.5$! The velocity gained during step $0$ carries position forward an extra $1.0$ unit during step $1$.',
          },
          {
            id: 'b',
            latex: 'A_d B_d = \\begin{bmatrix} 1.5 \\\\ 1 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} 0.5 & 0 \\\\ 1 & 0 \\\\ 1.5 & 0.5 \\\\ 1 & 1 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'A_d B_d = \\begin{bmatrix} 1 \\\\ 1.5 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} 0.5 & 0 \\\\ 1 & 0 \\\\ 1 & 0.5 \\\\ 1.5 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check row 2 of $A_d$: $[0,\\; 1][0.5,\\; 1]^T = 1$ (constant coasting velocity without friction), while position integrates to $1.5$ in row 1.',
          },
          {
            id: 'd',
            latex: 'A_d B_d = \\begin{bmatrix} 1.5 \\\\ 1 \\end{bmatrix}, \\qquad \\Gamma = \\begin{bmatrix} 0.5 & 1.5 \\\\ 1 & 1 \\\\ 0 & 0.5 \\\\ 0 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Keep the lower block-triangular causal layout: rows 1–2 are $\\mathbf{x}_1$ ($[B_d,\\; 0]$) and rows 3–4 are $\\mathbf{x}_2$ ($[A_d B_d,\\; B_d]$).',
          },
        ],
        lockedLabel: 'Exact Γ Matrix',
        lockedResultLatex: 'A_d B_d = \\textcolor{#34D399}{\\begin{bmatrix}1.5\\\\1\\end{bmatrix}} \\implies \\Gamma = \\textcolor{#34D399}{\\begin{bmatrix}0.5&0\\\\1&0\\\\1.5&0.5\\\\1&1\\end{bmatrix}}',
        hint: 'Row 1 of $A_d B_d$ is $1(0.5) + 1(1) = 1.5$; row 2 is $0(0.5) + 1(1) = 1$.',
      },
      {
        stepType: 'mpc_condensed_qp',
        badge: 'Form Condensed Convex QP (Hessian H & Linear f)',
        whyThisStep:
          'Substituting $X = \\Phi\\mathbf{x}_0 + \\Gamma U$ into the quadratic stage cost converts the control problem into a standard strictly convex Quadratic Program solved in microseconds by OSQP, HPIPM, or qpOASES.',
        systemImpact:
          'Because $\\bar{Q} \\succeq 0$ and $\\bar{R} \\succ 0$, the QP Hessian $H = 2(\\Gamma^T \\bar{Q} \\Gamma + \\bar{R})$ is strictly positive definite — guaranteeing a UNIQUE global optimum with zero local-minima traps!',
        prompt:
          'Substitute $X = \\Phi\\mathbf{x}_0 + \\Gamma U$ into $J(U) = X^T \\bar{Q} X + U^T \\bar{R} U$ and match the standard QP form $\\min_U \\frac{1}{2}U^T H U + f(\\mathbf{x}_0)^T U$.',
        highlightLatex:
          'J(U) = (\\Phi\\mathbf{x}_0 + \\Gamma U)^T \\textcolor{#F59E0B}{\\bar{Q}}(\\Phi\\mathbf{x}_0 + \\Gamma U) + U^T \\textcolor{#F59E0B}{\\bar{R}} U',
        options: [
          {
            id: 'a',
            latex: 'H = \\Gamma^T \\bar{Q} \\Gamma + \\bar{R}, \\qquad f(\\mathbf{x}_0) = \\Gamma^T \\bar{Q} \\Phi \\mathbf{x}_0',
            correct: false,
            misconception:
              'Watch the standard $\\frac{1}{2}$ factor in $\\frac{1}{2} U^T H U + f^T U$! Expanding $(\\Phi\\mathbf{x}_0 + \\Gamma U)^T \\bar{Q}(\\Phi\\mathbf{x}_0 + \\Gamma U)$ produces $U^T(\\Gamma^T\\bar{Q}\\Gamma + \\bar{R})U + 2(\\Phi\\mathbf{x}_0)^T\\bar{Q}\\Gamma U$, so $H = 2(\\Gamma^T\\bar{Q}\\Gamma + \\bar{R})$ and $f = 2\\Gamma^T\\bar{Q}\\Phi\\mathbf{x}_0$ (or equivalently minimize $\\frac{1}{2}J$).',
          },
          {
            id: 'b',
            latex: 'H = 2(\\Gamma^T \\bar{Q} \\Gamma + \\bar{R}) \\succ 0, \\qquad f(\\mathbf{x}_0) = 2\\,\\Gamma^T \\bar{Q} \\Phi \\mathbf{x}_0',
            correct: true,
          },
          {
            id: 'c',
            latex: 'H = 2(\\Phi^T \\bar{Q} \\Phi + \\bar{R}), \\qquad f(\\mathbf{x}_0) = 2\\,\\Phi^T \\bar{Q} \\Gamma \\mathbf{x}_0',
            correct: false,
            misconception:
              'The optimization variable is $U$ (multiplied by $\\Gamma$), NOT $\\mathbf{x}_0$ (multiplied by $\\Phi$)! $\\mathbf{x}_0^T \\Phi^T \\bar{Q} \\Phi \\mathbf{x}_0$ is a constant independent of $U$.',
          },
          {
            id: 'd',
            latex: 'H = 2\\,\\Gamma^T \\bar{Q} \\Gamma, \\qquad f(\\mathbf{x}_0) = 2\\,\\bar{R}U',
            correct: false,
            misconception:
              'The control effort term $U^T \\bar{R} U$ is quadratic in $U$, so $2\\bar{R}$ belongs inside the Hessian $H$ (where it also guarantees $H \\succ 0$!).',
          },
        ],
        lockedLabel: 'Condensed Convex QP',
        lockedResultLatex: 'H = \\textcolor{#34D399}{2(\\Gamma^T\\bar{Q}\\Gamma + \\bar{R})\\succ 0}, \\quad f(\\mathbf{x}_0) = \\textcolor{#34D399}{2\\Gamma^T\\bar{Q}\\Phi\\mathbf{x}_0}',
        hint: 'Expand $U^T(\\Gamma^T\\bar{Q}\\Gamma + \\bar{R})U + 2\\mathbf{x}_0^T\\Phi^T\\bar{Q}\\Gamma U$ and match to $\\frac{1}{2}U^T H U + f^T U$.',
      },
      {
        stepType: 'mpc_constraints',
        badge: 'Encode Hard Actuator & State Constraints GU ≤ w',
        whyThisStep:
          'Unlike LQR (which blindly outputs $u = -K\\mathbf{x}$ and clips after the fact), MPC embeds physical motor torque, voltage, and position limits directly inside the optimizer’s feasible polytope.',
        systemImpact:
          'Writing linear inequalities $G U \\le w$ keeps the problem a fast convex QP while letting the controller anticipate upcoming braking or workspace limits $N$ steps in advance!',
        prompt:
          'How are the hard torque limits $|u_0| \\le 1,\\; |u_1| \\le 1$ (and optional state box limits $X \\le X_{\\max}$) encoded inside the condensed QP?',
        highlightLatex:
          '|u_k| \\le \\textcolor{#F59E0B}{1} \\iff -1 \\le u_k \\le 1, \\qquad \\Phi\\mathbf{x}_0 + \\Gamma U \\le X_{\\max}',
        options: [
          {
            id: 'a',
            latex: '\\text{Clip } U^* = \\operatorname{sat}( -H^{-1} f ) \\text{ after solving the unconstrained QP}',
            correct: false,
            misconception:
              'Post-hoc saturation is NOT optimal in multivariable/multi-step control! When $u_0$ hits $+1$, the optimizer must adjust $u_1$ jointly to compensate — which only happens inside the constrained QP.',
          },
          {
            id: 'b',
            latex: '\\text{Raise } \\bar{R} \\text{ until unconstrained } |u_k| \\le 1 \\text{ for the worst-case initial state}',
            correct: false,
            misconception:
              'Detuning $\\bar{R}$ for worst-case saturation makes the controller sluggish for normal small errors! Hard QP constraints give full agility inside the limits and crisp clamping at the boundary.',
          },
          {
            id: 'c',
            latex: '\\text{Linear inequalities } G U \\le w: \\; \\begin{bmatrix}I_2\\\\-I_2\\end{bmatrix}U \\le \\mathbf{1}_4 \\;\\text{ and }\\; \\Gamma U \\le X_{\\max} - \\Phi\\mathbf{x}_0',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Non-convex equality constraints } u_k^2 = 1 \\text{ forcing bang-bang switching}',
            correct: false,
            misconception:
              'Equality $u_k^2 = 1$ destroys convexity and prevents smooth equilibrium regulation ($u_k = 0$); linear box inequalities $-1 \\le u_k \\le 1$ preserve convexity.',
          },
        ],
        lockedLabel: 'Hard QP Constraints',
        lockedResultLatex: '\\textcolor{#34D399}{G U \\le w:\\; \\begin{bmatrix}I_2\\\\-I_2\\end{bmatrix}U \\le \\mathbf{1}, \\; \\Gamma U \\le X_{\\max}-\\Phi\\mathbf{x}_0}',
        hint: 'Split $|u_k| \\le 1$ into $+u_k \\le 1$ and $-u_k \\le 1$, and move $\\Phi\\mathbf{x}_0$ to the right-hand side of $\\Phi\\mathbf{x}_0 + \\Gamma U \\le X_{\\max}$.',
      },
      {
        stepType: 'receding_horizon',
        badge: 'Apply the Receding-Horizon Feedback Principle',
        whyThisStep:
          'Even though the QP computes an entire optimal future sequence $U^* = [u_0^*, u_1^*, \\dots, u_{N-1}^*]^T$, blindly executing all $N$ steps open-loop would let model mismatch and wind gusts accumulate unchecked.',
        systemImpact:
          'Executing ONLY $u_0^*$, reading fresh sensor feedback $\\mathbf{x}_{k+1}$, and re-solving at every tick transforms open-loop trajectory planning into a true closed-loop, disturbance-rejecting feedback law!',
        prompt:
          'Once the QP solver returns the optimal horizon plan $U^* = [u_0^*,\\; u_1^*]^T$ at step $k$, what does the **Receding-Horizon Principle** execute on the physical actuator?',
        highlightLatex:
          'U^* = \\begin{bmatrix} \\textcolor{#34D399}{u_0^*} \\\\ \\textcolor{#22D3EE}{u_1^*} \\end{bmatrix} \\;\\longrightarrow\\; \\text{Plant at } t_k \\;\\longrightarrow\\; \\text{Measure } \\mathbf{x}_{k+1}',
        options: [
          {
            id: 'a',
            latex: '\\text{Apply ONLY } u_0^*, \\text{ measure the new state } \\mathbf{x}_{k+1}, \\text{ shift the horizon forward, and re-solve the QP}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{Execute the entire sequence } u_0^*, u_1^* \\text{ open-loop and re-solve only every } N \\text{ steps}',
            correct: false,
            misconception:
              'Waiting $N$ steps leaves the robot running open-loop between solves, allowing disturbances and model errors to grow unchecked!',
          },
          {
            id: 'c',
            latex: '\\text{Average } (u_0^* + u_1^*)/2 \\text{ to smooth the torque command}',
            correct: false,
            misconception:
              'Averaging destroys the optimal plan and can immediately violate dynamics and constraints; $u_0^*$ is the exact optimal action for the current tick.',
          },
          {
            id: 'd',
            latex: '\\text{Apply } u_1^* \\text{ first to compensate for actuator time delay}',
            correct: false,
            misconception:
              '$u_1^*$ was computed for the predicted future state $\\mathbf{x}_1$, NOT the current state $\\mathbf{x}_0$; always apply $u_0^*$ (model delays explicitly in $A_d, B_d$ instead).',
          },
        ],
        lockedLabel: 'Receding Horizon Law',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Apply } u_0^* \\text{ ONLY} \\to \\text{measure } \\mathbf{x}_{k+1} \\to \\text{re-solve QP}}',
        hint: 'Closing the feedback loop requires throwing away the tail $u_1^*, \\dots, u_{N-1}^*$ after executing the first action.',
      },
      {
        stepType: 'mpc_terminal_dare',
        badge: 'Guarantee Stability via Terminal Cost P_f = P_DARE',
        whyThisStep:
          'Short-horizon MPC can act myopically — accelerating aggressively toward a target and running out of braking distance just past step $N$! Terminal ingredients rigorously eliminate short-horizon instability.',
        systemImpact:
          'Appending the infinite-horizon LQR cost-to-go $x_N^T P_{\\text{DARE}} x_N$ (plus a terminal invariant set $\\mathcal{X}_f$) turns the finite-horizon MPC objective into a strict Lyapunov function, guaranteeing recursive feasibility and asymptotic stability!',
        prompt:
          'Why do production MPC designers set the terminal state weight $P_f$ equal to the Discrete Algebraic Riccati solution $P_{\\text{DARE}}$ (the infinite-horizon LQR tail)?',
        highlightLatex:
          'J_N = \\sum_{j=0}^{N-1}(\\mathbf{x}_j^T Q\\mathbf{x}_j + u_j^T R u_j) + \\mathbf{x}_N^T \\textcolor{#34D399}{P_{\\text{DARE}}} \\mathbf{x}_N',
        options: [
          {
            id: 'a',
            latex: '\\text{It eliminates all actuator constraints } |u_k| \\le 1 \\text{ so the QP becomes unconstrained}',
            correct: false,
            misconception:
              'Constraints remain fully active over steps $0 \\dots N-1$; $P_{\\text{DARE}}$ models the unconstrained infinite LQR tail AFTER the state enters the safe terminal region $\\mathcal{X}_f$.',
          },
          {
            id: 'b',
            latex: '\\text{It appends the exact infinite-horizon LQR cost-to-go tail, making } J_N^*(\\mathbf{x}) \\text{ a Lyapunov function that guarantees stability \\& recursive feasibility}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{It reduces the horizon length } N \\text{ to zero so no QP solver is needed}',
            correct: false,
            misconception:
              'With $N = 0$ there are no decision variables and no constraint handling; $P_{\\text{DARE}}$ allows a SHORT tractable horizon $N$ while keeping infinite-horizon stability guarantees.',
          },
          {
            id: 'd',
            latex: '\\text{It forces the state to reach } \\mathbf{x}_N = 0 \\text{ in exact deadbeat time regardless of torque limits}',
            correct: false,
            misconception:
              'A hard equality constraint $\\mathbf{x}_N = 0$ frequently becomes INFEASIBLE under torque limits! Using $P_f = P_{\\text{DARE}}$ over an invariant set $\\mathcal{X}_f$ avoids infeasibility while proving stability.',
          },
        ],
        lockedLabel: 'MPC Stability Guarantee',
        lockedResultLatex: '\\textcolor{#34D399}{P_f = P_{\\text{DARE}} \\;+\\; \\mathcal{X}_f \\implies \\text{Lyapunov stability \\& recursive feasibility}}',
        hint: 'What does $\\mathbf{x}_N^T P_{\\text{DARE}} \\mathbf{x}_N$ represent physically for all steps $j = N, N+1, \\dots, \\infty$?',
      },
    ],
  },

  {
    id: 'ss3-cbf-qp-safety',
    tier: 'mpc-cbf',
    tierLabel: 'MPC & CBF-QP Safety',
    title: 'Modern SOTA Safety-Critical Control: Control Barrier Functions (CBF-QP)',
    mechatronicsContext:
      'When deploying aggressive LQR, MPC, or neural reinforcement-learning policies on physical drones, cobots, or self-driving vehicles, you need a mathematical hard shield that NEVER lets the robot hit an obstacle or joint stop. Control Barrier Function QPs (CBF-QP) enforce provable forward invariance at >1 kHz with minimal deviation from nominal commands.',
    expressionLatex:
      '\\dot{x}=-x+u,\\; h(x)=5-x\\ge 0,\\; \\alpha=2,\\; u_{\\text{nom}}=10',
    finalAnswerLatex:
      '\\dot{h} = x - u, \\qquad \\dot{h} + 2h \\ge 0 \\implies u \\le 6, \\qquad u_{\\text{CBF}}^* = 6 \\;(\\text{safe invariance } x(t)\\le 5)',
    diagram: {
      type: 'mpc-cbf',
      variant: 'cbf',
      horizon: '1 kHz QP',
      constraint: 'h(x) ≥ 0',
      barrier: 'h(x)=5−x≥0',
      cost: '½‖u−u_nom‖²',
      subtitle: 'CBF-QP Safety Filter Shield',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.5],
      setpoint: 5.0,
      setpointLabel: 'Safety Wall x_max = 5',
      primaryLabel: 'CBF-QP Safe x(t) = 5 − e⁻²ᵗ',
      baselineLabel: 'Unsafe Nominal u_nom = 10',
      primaryFn: (t) => 5 - Math.exp(-2 * t),
      baselineFn: (t) => 10 - 6 * Math.exp(-t),
      defaultCursor: 0.25,
      subtitle:
        'Hover across time $t$ starting from $x(0)=4$: the unsafe nominal command $u_{\\text{nom}}=10$ (Cyan dashed) blasts straight through the safety wall $x_{\\max}=5$ at $t=0.18\\text{ s}$, while the CBF-QP shield (Emerald) clamps $u^*(t)=5+e^{-2t}$ so $x(t)=5-e^{-2t}$ asymptotically kisses $5$ without EVER crossing!',
      domainMeta: 'Forward Invariance · h(x) = 5 − x ≥ 0 · α = 2 · x(0) = 4',
      metrics: [
        { label: 'Barrier h(4)', value: '+1.0 > 0 (Safe)' },
        { label: 'CBF Bound', value: 'u ≤ 6 (Linear in u)' },
        { label: 'CBF-QP Output', value: 'u* = 6 (vs u_nom=10)' },
        { label: 'Safety Proof', value: 'x(t) < 5 ∀ t ≥ 0 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'cbf_safe_set',
        badge: 'Define Safe Set 𝒞 = {x : h(x) ≥ 0}',
        whyThisStep:
          'A Control Barrier Function encodes physical safety boundaries (obstacle clearance, speed limits, joint stops) as the zero-superlevel set of a smooth scalar function $h(x)$ whose sign tells you immediately how much safety margin remains.',
        systemImpact:
          'Setting $h(x) = 5 - x$ defines the safe set $\\mathcal{C} = (-\\infty, 5]$; evaluating $h(4) = 5 - 4 = +1 > 0$ confirms the robot starts strictly inside the safe region with $1$ unit of remaining clearance.',
        prompt:
          'To enforce the hard upper limit $x(t) \\le x_{\\max} = 5$, choose the barrier function $h(x)$ defining the safe set $\\mathcal{C} = \\{x : h(x) \\ge 0\\}$ and evaluate $h(4)$.',
        highlightLatex:
          '\\mathcal{C} = \\{x \\in \\mathbb{R} : \\textcolor{#34D399}{h(x) \\ge 0}\\}, \\qquad x_{\\max} = \\textcolor{#F59E0B}{5}, \\quad x(0) = \\textcolor{#22D3EE}{4}',
        options: [
          {
            id: 'a',
            latex: 'h(x) = x - 5, \\qquad h(4) = -1',
            correct: false,
            misconception:
              'Sign flipped! With $h(x) = x - 5$, the safe set $h(x) \\ge 0$ would mean $x \\ge 5$ (the UNSAFE side of the wall!). Always orient $h(x) \\ge 0$ inside the safe set.',
          },
          {
            id: 'b',
            latex: 'h(x) = 5 - x, \\qquad h(4) = +1 > 0\\;(\\text{strictly inside } \\mathcal{C})',
            correct: true,
          },
          {
            id: 'c',
            latex: 'h(x) = (5 - x)^2, \\qquad h(4) = +1 > 0',
            correct: false,
            misconception:
              'Squaring makes $h(x) \\ge 0$ EVERYWHERE (including $x = 100$!) and makes $\\nabla h(5) = 0$ vanish right on the wall — violating the regular barrier requirement!',
          },
          {
            id: 'd',
            latex: 'h(x) = 4 - x, \\qquad h(4) = 0',
            correct: false,
            misconception:
              'The safety wall is at $x_{\\max} = 5$, not at the current state $x = 4$.',
          },
        ],
        lockedLabel: 'Barrier Function h(x)',
        lockedResultLatex: 'h(x) = \\textcolor{#34D399}{5 - x \\ge 0}, \\qquad h(4) = \\textcolor{#34D399}{+1 > 0}',
        hint: 'You need $h(x) > 0$ when $x < 5$, $h(5) = 0$ on the boundary, and $h(x) < 0$ if $x > 5$.',
      },
      {
        stepType: 'cbf_lie_derivatives',
        badge: 'Compute Lie Derivatives ḣ = L_f h + L_g h · u',
        whyThisStep:
          'For any control-affine robot dynamics $\\dot{x} = f(x) + g(x)u$, the chain rule splits $\\dot{h}$ into drift $L_f h$ and control authority $L_g h\\,u$ — proving why the safety condition stays strictly LINEAR in $u$!',
        systemImpact:
          'Obtaining $\\dot{h} = x - u$ exposes the physical balance: natural damping ($-x$) pulls the state safely away from the wall ($+x$ helps $h$ grow), while positive drive ($+u$) pushes toward the wall ($-u$ shrinks $h$).',
        prompt:
          'For $\\dot{x} = f(x) + g(x)u = -x + u$ and $h(x) = 5 - x$, compute the Lie derivatives $L_f h = \\frac{\\partial h}{\\partial x} f(x)$ and $L_g h = \\frac{\\partial h}{\\partial x} g(x)$ to write $\\dot{h}(x, u)$.',
        highlightLatex:
          '\\dot{h} = \\frac{\\partial h}{\\partial x}\\,\\dot{x} = \\textcolor{#22D3EE}{(-1)}(\\textcolor{#22D3EE}{-x} + \\textcolor{#F59E0B}{1}\\cdot u)',
        options: [
          {
            id: 'a',
            latex: 'L_f h = -x,\\; L_g h = +1 \\implies \\dot{h} = -x + u',
            correct: false,
            misconception:
              'Do not forget the minus sign from $\\frac{\\partial h}{\\partial x} = \\frac{d}{dx}(5 - x) = -1$! Because $h$ shrinks as $x$ grows, $\\dot{h} = -\\dot{x} = x - u$.',
          },
          {
            id: 'b',
            latex: 'L_f h = +x,\\; L_g h = -1 \\implies \\dot{h} = x - u',
            correct: true,
          },
          {
            id: 'c',
            latex: 'L_f h = 5 - x,\\; L_g h = -1 \\implies \\dot{h} = 5 - x - u',
            correct: false,
            misconception:
              'The derivative of the constant $5$ is $0$; $L_f h = (-1)(-x) = +x$, with no constant $5$.',
          },
          {
            id: 'd',
            latex: 'L_f h = +x,\\; L_g h = +1 \\implies \\dot{h} = x + u',
            correct: false,
            misconception:
              'Check $L_g h = (-1)(+1) = -1$: pushing $u > 0$ drives $x$ toward the wall $5$, so it MUST decrease safety margin $h$ ($-u$).',
          },
        ],
        lockedLabel: 'Barrier Derivative ḣ',
        lockedResultLatex: '\\dot{h} = L_f h + L_g h\\,u = \\textcolor{#34D399}{x - u}',
        hint: 'Differentiate $h(x) = 5 - x$ with respect to time: $\\dot{h} = -\\dot{x} = -(-x + u)$.',
      },
      {
        stepType: 'cbf_inequality',
        badge: 'Enforce Forward-Invariance Condition ḣ + αh ≥ 0',
        whyThisStep:
          'Requiring $\\dot{h} \\ge 0$ everywhere would forbid ever approaching the wall; the CBF condition $\\dot{h} + \\alpha h \\ge 0$ lets the robot approach smoothly at rate $\\alpha$ while guaranteeing $h(t) \\ge h(0)e^{-\\alpha t} > 0$ forever!',
        systemImpact:
          'At $x = 4$ with $\\alpha = 2$, the CBF inequality simplifies to the single affine half-space constraint $u \\le 6$ — smoothly throttling allowable drive as $x \\to 5$ (where it tightens to $u \\le 5$).',
        prompt:
          'Substitute $\\dot{h} = x - u$, $h = 5 - x$, $\\alpha = 2$, and current state $x = 4$ into the CBF inequality $\\dot{h}(x,u) + \\alpha h(x) \\ge 0$ to find the exact safe control bound on $u$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{(x - u)} + \\textcolor{#F59E0B}{2}\\,\\textcolor{#22D3EE}{(5 - x)} \\ge 0 \\qquad \\text{at } x = 4',
        options: [
          {
            id: 'a',
            latex: 'u \\le 4',
            correct: false,
            misconception:
              'That enforces $\\dot{h} \\ge 0$ ($\\alpha = 0$, never allowed to move closer to $5$)! Including $+\\alpha h(4) = +2(1) = +2$ permits safe controlled approach up to $u \\le 6$.',
          },
          {
            id: 'b',
            latex: 'u \\ge 6',
            correct: false,
            misconception:
              'Direction flipped! Moving $-u$ across the inequality $6 - u \\ge 0$ yields $u \\le 6$ (an UPPER cap preventing collision with $x_{\\max} = 5$).',
          },
          {
            id: 'c',
            latex: '(4 - u) + 2(1) \\ge 0 \\implies u \\le 6',
            correct: true,
          },
          {
            id: 'd',
            latex: 'u \\le 10',
            correct: false,
            misconception:
              'Check the algebra at $x = 4$: $(4 - u) + 2(5 - 4) = 4 - u + 2 = 6 - u \\ge 0 \\implies u \\le 6$; $u = 10$ would slam straight through $x = 5$!',
          },
        ],
        lockedLabel: 'Safe Control Bound',
        lockedResultLatex: '\\dot{h} + 2h \\ge 0 \\implies \\textcolor{#34D399}{u \\le 6}',
        hint: 'Plug $x = 4$ into $(x - u) + 2(5 - x) \\ge 0$ and isolate $u$.',
      },
      {
        stepType: 'cbf_qp_solve',
        badge: 'Solve the 1D CBF-QP Safety Filter',
        whyThisStep:
          'A safety filter should be completely invisible when the nominal controller is already safe, and intervene with the smallest possible modification when a violation is imminent.',
        systemImpact:
          'Minimizing $\\frac{1}{2}(u - 10)^2$ subject to $u \\le 6$ snaps minimally to the active constraint $u^* = 6$, clipping off exactly the $4$ units of unsafe command while keeping maximum safe forward speed!',
        prompt:
          'Solve the closed-form CBF-QP safety filter $\\min_u \\frac{1}{2}(u - u_{\\text{nom}})^2$ subject to $u \\le 6$ when the nominal controller demands $u_{\\text{nom}} = 10$.',
        highlightLatex:
          'u^* = \\arg\\min_{u \\le \\textcolor{#34D399}{6}} \\; \\frac{1}{2}\\big(u - \\textcolor{#F59E0B}{10}\\big)^2',
        options: [
          {
            id: 'a',
            latex: 'u^* = 10 \\;(\\text{constraint inactive})',
            correct: false,
            misconception:
              '$u_{\\text{nom}} = 10$ violates the CBF constraint $u \\le 6$, so the QP MUST intervene to guarantee forward invariance.',
          },
          {
            id: 'b',
            latex: 'u^* = 0 \\;(\\text{emergency stop})',
            correct: false,
            misconception:
              'An e-stop ($u = 0$) is massively over-conservative and wastes $(0 - 10)^2/2 = 50$ cost! The minimally invasive QP projects onto the boundary $u^* = 6$ (cost $8$).',
          },
          {
            id: 'c',
            latex: 'u^* = 5 \\;(\\text{equilibrium hold at } x_{\\max})',
            correct: false,
            misconception:
              '$u \\le 5$ is the tighter bound right ON the wall ($x = 5$); at $x = 4$, the robot still has $h(4)=1$ clearance so $u^* = 6$ is strictly safe and closer to $u_{\\text{nom}} = 10$.',
          },
          {
            id: 'd',
            latex: 'u^* = 6 \\;(\\text{minimal projection onto } u \\le 6)',
            correct: true,
          },
        ],
        lockedLabel: 'CBF-QP Safe Control',
        lockedResultLatex: 'u_{\\text{CBF}}^* = \\textcolor{#34D399}{6} \\quad (\\text{minimally invasive vs } u_{\\text{nom}}=10)',
        hint: 'Which number $u \\le 6$ is closest to $u_{\\text{nom}} = 10$?',
      },
      {
        stepType: 'cbf_sota_shield',
        badge: 'Why CBF-QP / MPC-CBF Is the SOTA Robotic Safety Shield',
        whyThisStep:
          'Classical controllers and end-to-end neural/RL policies lack formal collision proofs; understanding how CBF-QP wraps ANY policy explains its explosive adoption across autonomous drones, legged robots, and factory cobots.',
        systemImpact:
          'Because $L_f h(x) + L_g h(x)\\,u + \\alpha(h(x)) \\ge 0$ is affine in $u$ even for highly nonlinear robots, **CBF-QP** runs at $>1\\text{ kHz}$ as a plug-and-play provable safety filter around LQR, MPC, teleoperation, or RL policies!',
        prompt:
          'Why has **CBF-QP** (and combined **MPC-CBF**) become the state-of-the-art safety layer wrapping LQR, MPC, and learned RL/neural policies on physical robots?',
        highlightLatex:
          '\\min_{\\mathbf{u}} \\frac{1}{2}\\|\\mathbf{u} - \\mathbf{u}_{\\text{policy}}\\|^2 \\quad \\text{s.t.} \\quad \\underbrace{L_f h(\\mathbf{x}) + L_g h(\\mathbf{x})\\,\\mathbf{u} + \\alpha(h(\\mathbf{x})) \\ge 0}_{\\textcolor{#34D399}{\\text{Affine in } \\mathbf{u} \\;\\to\\; \\text{Convex QP at }>1\\text{ kHz}}}',
        options: [
          {
            id: 'a',
            latex: '\\text{It requires linear plant dynamics } \\dot{\\mathbf{x}} = A\\mathbf{x} + B\\mathbf{u} \\text{ and cannot handle nonlinear robots}',
            correct: false,
            misconception:
              'CBF-QP works directly on NONLINEAR control-affine systems $\\dot{\\mathbf{x}} = f(\\mathbf{x}) + g(\\mathbf{x})\\mathbf{u}$ because the constraint is still strictly linear in $\\mathbf{u}$ at the current state $\\mathbf{x}$!',
          },
          {
            id: 'b',
            latex: '\\text{Even for nonlinear control-affine plants, the CBF inequality is linear in } \\mathbf{u}, \\text{ yielding a real-time } (>1\\text{ kHz}) \\text{ convex QP shield with provable forward invariance for ANY nominal policy}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{It replaces trajectory planning completely and guarantees global minimum-energy optimality}',
            correct: false,
            misconception:
              'A 1-step CBF-QP is myopic (safety-only, not multi-step optimal), which is why it WRAPS a nominal planner (LQR, MPC, or RL) — or embeds inside MPC-CBF for look-ahead safety!',
          },
          {
            id: 'd',
            latex: '\\text{It only works offline during simulation training and cannot run on embedded flight controllers}',
            correct: false,
            misconception:
              'Small CBF-QPs solve in $10\\text{–}200\\,\\mu\\text{s}$ on embedded ARM/C++ flight controllers, making them ideal for real-time online safety filtering!',
          },
        ],
        lockedLabel: 'SOTA Safety Shield',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{CBF-QP: } >1\\text{ kHz convex shield guaranteeing } \\mathbf{x}(t)\\in\\mathcal{C} \\text{ for LQR/MPC/RL}}',
        hint: 'Focus on the linearity of $L_f h + L_g h\\,\\mathbf{u} + \\alpha(h) \\ge 0$ with respect to the control input $\\mathbf{u}$ and its model-agnostic policy-wrapping structure.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: LUENBERGER OBSERVERS, KALMAN FILTER & NONLINEAR EKF/UKF (3 problems)
  // =========================================================================
  {
    id: 'ss4-luenberger-sep',
    tier: 'observers-kf',
    tierLabel: 'Observers & Kalman',
    title: 'Luenberger State Observer, Duality & Doyle’s LQG Margin Warning',
    mechatronicsContext:
      'Full-state feedback u = −Kx assumes you measure every position and velocity — yet real actuators rarely have noise-free tachometers. A Luenberger observer reconstructs hidden states via innovation feedback L(y − C x̂), while Doyle’s landmark 1978 theorem warns every engineer never to trust observer-based LQG margins blindly.',
    expressionLatex:
      'A=\\begin{bmatrix}0&1\\\\0&-2\\end{bmatrix},\\; B=\\begin{bmatrix}0\\\\1\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix}, \\quad s_{\\text{obs}}=-6,-6 \\;\\;\\longrightarrow\\;\\; L',
    finalAnswerLatex:
      'L=\\begin{bmatrix}10\\\\16\\end{bmatrix}, \\quad \\dot{\\mathbf{e}}=(A-LC)\\mathbf{e}, \\quad \\text{eig}(A_{\\text{aug}})=\\text{eig}(A-BK)\\cup\\text{eig}(A-LC), \\quad \\text{LQG has NO guaranteed margins!}',
    diagram: {
      type: 'state-space-loop',
      variant: 'observer',
      A: '[[0,1],[0,−2]]',
      B: '[0,1]ᵀ',
      C: '[1,0]',
      controller: 'u=−Kx̂',
      observer: 'L=[10,16]ᵀ',
      subtitle: 'Luenberger Observer & Separation',
    },
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -7.5, maxRe: 1.5, minIm: -3.2, maxIm: 3.2 },
      poles: [
        { re: 0, im: 0, label: 'Plant p₁ = 0', status: 'marginal' },
        { re: -2, im: 0, label: 'Plant p₂ = −2', status: 'lhp' },
        { re: -6, im: 0, label: 'Observer −6, −6 (3× faster)', status: 'lhp' },
      ],
      hudLabel: 'Observer L = [10, 16]ᵀ · Double Pole at −6 (3× Faster Decay)',
      defaultCursor: 0.5,
      subtitle:
        'Placing the Luenberger observer double pole at $s = -6, -6$ ($3\\times$ deeper into the LHP than the plant pole at $-2$) forces velocity estimation error $\\mathbf{e}(t) = \\mathbf{x} - \\hat{\\mathbf{x}}$ to collapse cleanly before closed-loop transients finish.',
      domainMeta: 'Observer Eigenvalues · A − LC at −6, −6 · Separation Principle',
      metrics: [
        { label: 'Observability', value: '𝒪 = I₂ (Rank 2)' },
        { label: 'Observer Gain L', value: '[10, 16]ᵀ' },
        { label: 'Error Poles', value: '−6, −6 (Crit. Damped)' },
        { label: 'Doyle Warning', value: 'LQG PM ≠ 60° (Check!) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'obs_check',
        badge: 'Verify Observability from Position Sensor Alone',
        whyThisStep:
          'Before computing an observer gain $L$, you must verify that the output $y = C\\mathbf{x}$ carries full visibility into every state mode — otherwise estimation errors along unobservable directions can never be arbitrarily accelerated.',
        systemImpact:
          'Finding $\\mathcal{O} = I_2$ (rank 2) proves that a single shaft encoder ($y = x_1$) completely reconstructs hidden angular velocity $x_2$ for any desired observer convergence rate!',
        prompt:
          'Compute the observability matrix $\\mathcal{O} = \\begin{bmatrix}C \\\\ CA\\end{bmatrix}$ for $A = \\begin{bmatrix}0 & 1 \\\\ 0 & -2\\end{bmatrix}$ and $C = [1\\; 0]$.',
        highlightLatex:
          '\\mathcal{O} = \\begin{bmatrix} \\textcolor{#F59E0B}{C} \\\\ \\textcolor{#F59E0B}{C}\\textcolor{#22D3EE}{A} \\end{bmatrix}, \\qquad A=\\begin{bmatrix}0&1\\\\0&-2\\end{bmatrix},\\; C=\\begin{bmatrix}1&0\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{O} = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}, \\qquad \\operatorname{rank}(\\mathcal{O}) = 2\\;(\\text{observable})',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathcal{O} = \\begin{bmatrix} 1 & 0 \\\\ 0 & -2 \\end{bmatrix}, \\qquad \\operatorname{rank}(\\mathcal{O}) = 2',
            correct: false,
            misconception:
              '$CA$ extracts row 1 of $A$ ($[0,\\; 1]$), NOT row 2 ($[0,\\; -2]$).',
          },
          {
            id: 'c',
            latex: '\\mathcal{O} = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, \\qquad \\operatorname{rank}(\\mathcal{O}) = 1\\;(\\text{unobservable})',
            correct: false,
            misconception:
              'Check $CA = [1,\\; 0]\\begin{bmatrix}0&1\\\\0&-2\\end{bmatrix} = [0,\\; 1]$ — velocity directly integrates into position, giving full rank 2!',
          },
          {
            id: 'd',
            latex: '\\mathcal{O} = \\begin{bmatrix} 0 & 1 \\\\ 1 & -2 \\end{bmatrix}, \\qquad \\operatorname{rank}(\\mathcal{O}) = 2',
            correct: false,
            misconception:
              'Row 1 of $\\mathcal{O}$ is $C = [1,\\; 0]$ and row 2 is $CA = [0,\\; 1]$.',
          },
        ],
        lockedLabel: 'Observability Check',
        lockedResultLatex: '\\mathcal{O} = \\textcolor{#34D399}{\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}} \\implies \\text{Full Rank } 2',
        hint: 'Left-multiplying $A$ by $[1,\\; 0]$ reads off row 1 of $A$.',
      },
      {
        stepType: 'luenberger_ode',
        badge: 'Write Full-Order Luenberger Observer ODE',
        whyThisStep:
          'An open-loop plant simulator ($\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + Bu$) drifts forever from unknown initial errors or friction mismatch; injecting output error $L(y - C\\hat{\\mathbf{x}})$ closes the estimation loop.',
        systemImpact:
          'The term $y - C\\hat{\\mathbf{x}}$ is the **measurement innovation** — the exact discrepancy between what the physical sensor sees and what our digital twin predicted!',
        prompt:
          'Select the exact full-order Luenberger state observer differential equation driven by plant input $u$ and sensor measurement $y$.',
        highlightLatex:
          '\\dot{\\hat{\\mathbf{x}}} = \\underbrace{\\textcolor{#22D3EE}{A\\hat{\\mathbf{x}} + Bu}}_{\\text{digital twin model}} + \\underbrace{\\textcolor{#F59E0B}{L\\,(y - C\\hat{\\mathbf{x}})}}_{\\text{measurement correction}}',
        options: [
          {
            id: 'a',
            latex: '\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + Bu + L(C\\hat{\\mathbf{x}} - y)',
            correct: false,
            misconception:
              'Sign flipped! Subtracting $y$ from $C\\hat{\\mathbf{x}}$ turns negative feedback into positive feedback, driving $\\hat{\\mathbf{x}}$ AWAY from the true state!',
          },
          {
            id: 'b',
            latex: '\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + Bu + L(y - C\\hat{\\mathbf{x}})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + L(y - C\\hat{\\mathbf{x}})',
            correct: false,
            misconception:
              'Never omit the known control input $+Bu$! Without $+Bu$, every torque command looks like an unmodeled disturbance and creates huge lag in $\\hat{\\mathbf{x}}$.',
          },
          {
            id: 'd',
            latex: '\\dot{\\hat{\\mathbf{x}}} = (A - BK)\\hat{\\mathbf{x}} + Ly',
            correct: false,
            misconception:
              'Missing $-LC\\hat{\\mathbf{x}}$ leaves the innovation loop open! Even when $u = -K\\hat{\\mathbf{x}}$, the correction term must be $L(y - C\\hat{\\mathbf{x}})$.',
          },
        ],
        lockedLabel: 'Luenberger Observer',
        lockedResultLatex: '\\textcolor{#34D399}{\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + Bu + L(y - C\\hat{\\mathbf{x}})}',
        hint: 'Combine the plant copy $A\\hat{\\mathbf{x}} + Bu$ with $+L$ times the innovation $(y - C\\hat{\\mathbf{x}})$.',
      },
      {
        stepType: 'obs_error_ode',
        badge: 'Derive Autonomous Estimation Error Dynamics',
        whyThisStep:
          'Subtracting the observer from the true plant reveals whether estimation error $\\mathbf{e} = \\mathbf{x} - \\hat{\\mathbf{x}}$ depends on the actuator command $u(t)$ or decays autonomously.',
        systemImpact:
          'Because $Bu - Bu = 0$ cancels identically, $\\dot{\\mathbf{e}} = (A - LC)\\mathbf{e}$ is completely autonomous — choosing $L$ to place $\\operatorname{eig}(A - LC)$ in the LHP guarantees $\\hat{\\mathbf{x}}(t) \\to \\mathbf{x}(t)$ for ANY input $u(t)$!',
        prompt:
          'Define the estimation error $\\mathbf{e} = \\mathbf{x} - \\hat{\\mathbf{x}}$ and subtract $\\dot{\\hat{\\mathbf{x}}} = A\\hat{\\mathbf{x}} + Bu + L(C\\mathbf{x} - C\\hat{\\mathbf{x}})$ from $\\dot{\\mathbf{x}} = A\\mathbf{x} + Bu$.',
        highlightLatex:
          '\\dot{\\mathbf{e}} = \\dot{\\mathbf{x}} - \\dot{\\hat{\\mathbf{x}}} = A(\\mathbf{x}-\\hat{\\mathbf{x}}) + (Bu - Bu) - LC(\\mathbf{x}-\\hat{\\mathbf{x}})',
        options: [
          {
            id: 'a',
            latex: '\\dot{\\mathbf{e}} = (A - LC)\\mathbf{e} + Bu',
            correct: false,
            misconception:
              'Both the true plant and the observer receive the exact same known input $+Bu$, so $Bu - Bu = 0$ cancels completely!',
          },
          {
            id: 'b',
            latex: '\\dot{\\mathbf{e}} = (A + LC)\\mathbf{e}',
            correct: false,
            misconception:
              'Subtracting $+L(C\\mathbf{x} - C\\hat{\\mathbf{x}}) = +LC\\mathbf{e}$ gives $-LC\\mathbf{e}$, yielding $(A - LC)\\mathbf{e}$.',
          },
          {
            id: 'c',
            latex: '\\dot{\\mathbf{e}} = (A - LC)\\mathbf{e}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\dot{\\mathbf{e}} = (A - CL)\\mathbf{e}',
            correct: false,
            misconception:
              'Check dimensions: $L$ is $2\\times 1$ and $C$ is $1\\times 2$, so $LC$ is $2\\times 2$ (matching $A$), whereas $CL$ is a $1\\times 1$ scalar!',
          },
        ],
        lockedLabel: 'Error Dynamics',
        lockedResultLatex: '\\dot{\\mathbf{e}} = \\textcolor{#34D399}{(A - LC)\\mathbf{e}} \\quad (u\\text{ cancels identically!})',
        hint: 'Factor out $\\mathbf{e} = \\mathbf{x} - \\hat{\\mathbf{x}}$ after canceling $Bu$.',
      },
      {
        stepType: 'solve_obs_gain_l',
        badge: 'Place Observer Poles at s = −6, −6 to Find L',
        whyThisStep:
          'Rule of thumb: place observer poles $3\\text{–}5\\times$ faster than the controller/plant poles so $\\hat{\\mathbf{x}}$ locks onto $\\mathbf{x}$ rapidly — without pushing so far left that high-frequency encoder quantization noise explodes!',
        systemImpact:
          'Solving $\\det(sI - (A-LC)) = s^2 + (l_1 + 2)s + (2l_1 + l_2) = (s+6)^2$ yields exact observer gain $L = [10,\\; 16]^T$, giving critically damped, non-oscillatory error collapse.',
        prompt:
          'Compute $A - LC$ for $L = [l_1,\\; l_2]^T$ and solve $\\det(sI - (A - LC)) = (s + 6)^2 = s^2 + 12s + 36$ for $l_1$ and $l_2$.',
        highlightLatex:
          'A - LC = \\begin{bmatrix}-\\textcolor{#F59E0B}{l_1} & 1 \\\\ -\\textcolor{#F59E0B}{l_2} & -2\\end{bmatrix} \\implies \\det(sI-(A-LC)) = s^2 + (l_1+2)s + (2l_1+l_2)',
        options: [
          {
            id: 'a',
            latex: 'L = \\begin{bmatrix} 12 \\\\ 36 \\end{bmatrix}',
            correct: false,
            misconception:
              'Do not forget the existing plant damping ($-2$) inside $(s + l_1)(s + 2) + l_2 = s^2 + (l_1+2)s + (2l_1 + l_2)$! Both $l_1$ and $l_2$ must subtract out the $2$ terms.',
          },
          {
            id: 'b',
            latex: 'L = \\begin{bmatrix} 10 \\\\ 36 \\end{bmatrix}',
            correct: false,
            misconception:
              'You got $l_1 = 10$ right from $l_1 + 2 = 12$, now plug $l_1 = 10$ into $2l_1 + l_2 = 36 \\implies 20 + l_2 = 36 \\implies l_2 = 16$!',
          },
          {
            id: 'c',
            latex: 'L = \\begin{bmatrix} 16 \\\\ 10 \\end{bmatrix}',
            correct: false,
            misconception:
              'Swapped! $l_1 = 10$ enters the trace ($l_1 + 2 = 12$) and $l_2 = 16$ finishes the constant term ($2(10) + 16 = 36$).',
          },
          {
            id: 'd',
            latex: 'L = \\begin{bmatrix} 10 \\\\ 16 \\end{bmatrix}',
            correct: true,
          },
        ],
        lockedLabel: 'Observer Gain L',
        lockedResultLatex: 'L = \\textcolor{#34D399}{\\begin{bmatrix} 10 \\\\ 16 \\end{bmatrix}} \\implies \\operatorname{eig}(A-LC) = \\{-6,\\, -6\\}',
        hint: 'Match $s^1$: $l_1 + 2 = 12$; then match $s^0$: $2l_1 + l_2 = 36$.',
      },
      {
        stepType: 'separation_principle',
        badge: 'Apply the Separation Principle',
        whyThisStep:
          'When you replace true $\\mathbf{x}$ with estimated $\\hat{\\mathbf{x}}$ in $u = -K\\hat{\\mathbf{x}}$, you might worry that observer lag will shift the controller poles or destabilize the combined 4-state system.',
        systemImpact:
          'Transforming to $[\\mathbf{x},\\; \\mathbf{e}]^T$ makes the augmented $2n \\times 2n$ state matrix upper block-triangular, proving the combined eigenvalues split cleanly into $\\operatorname{eig}(A-BK) \\cup \\operatorname{eig}(A-LC)$!',
        prompt:
          'When closing the loop with output feedback $u = -K\\hat{\\mathbf{x}} = -K(\\mathbf{x} - \\mathbf{e})$, what does the **Separation Principle** guarantee for the combined plant + observer eigenvalues?',
        highlightLatex:
          '\\begin{bmatrix}\\dot{\\mathbf{x}} \\\\ \\dot{\\mathbf{e}}\\end{bmatrix} = \\begin{bmatrix} \\textcolor{#22D3EE}{A - BK} & BK \\\\ \\mathbf{0} & \\textcolor{#F59E0B}{A - LC} \\end{bmatrix}\\begin{bmatrix}\\mathbf{x} \\\\ \\mathbf{e}\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\text{Combined eigenvalues are } \\operatorname{eig}(A-BK) \\cup \\operatorname{eig}(A-LC): \\; K \\text{ and } L \\text{ can be designed independently for nominal stability}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{The off-diagonal } BK \\text{ block shifts the controller poles toward the RHP unless } L = K^T',
            correct: false,
            misconception:
              'The eigenvalues of ANY block-triangular matrix depend ONLY on its diagonal blocks ($A-BK$ and $A-LC$)! The upper-right $BK$ block affects transient coupling, NOT eigenvalue locations.',
          },
          {
            id: 'c',
            latex: '\\text{The Separation Principle holds for all nonlinear robots as well as linear systems}',
            correct: false,
            misconception:
              'Beware! Separation is strictly a LINEAR (LTI) theorem — on nonlinear plants, finite-time escape from estimation transients can destabilize a separately stabilizing controller!',
          },
          {
            id: 'd',
            latex: '\\text{The combined system only has } n \\text{ eigenvalues because the observer poles cancel the plant poles}',
            correct: false,
            misconception:
              'Plant ($n$ states) + full-order observer ($n$ states) has $2n$ eigenvalues total: the $n$ controller eigenvalues plus the $n$ observer eigenvalues.',
          },
        ],
        lockedLabel: 'Separation Principle',
        lockedResultLatex: '\\operatorname{eig}(A_{\\text{aug}}) = \\textcolor{#34D399}{\\operatorname{eig}(A-BK) \\cup \\operatorname{eig}(A-LC)}',
        hint: 'Use the block-triangular determinant identity $\\det\\begin{bmatrix}M_1 & M_{12}\\\\ 0 & M_2\\end{bmatrix} = \\det(M_1)\\det(M_2)$.',
      },
      {
        stepType: 'doyle_lqg_warning',
        badge: 'Critical Caveat: Doyle’s 1978 LQG Margin Theorem',
        whyThisStep:
          'One of the most famous traps in control engineering is assuming that combining optimal LQR (which has $\\ge 60^\\circ$ PM) with an optimal Kalman/Luenberger observer (LQG) preserves LQR’s robustness margins!',
        systemImpact:
          'John Doyle’s 1978 paper (*"Guaranteed Margins for LQG Regulators"*, abstract: *"There are none."*) proved that observer-based LQG can suffer **arbitrarily small gain and phase margins** — you MUST check loop Nyquist/Bode margins or apply Loop Transfer Recovery (LTR)!',
        prompt:
          'What critical real-world vulnerability did **Doyle’s 1978 LQG Theorem** prove when pairing full-state LQR with a state observer / Kalman filter ($u = -K\\hat{\\mathbf{x}}$)?',
        highlightLatex:
          '\\text{Full-State LQR: } \\text{PM} \\ge 60^\\circ \\quad \\xrightarrow{+\\text{ Observer / KF (LQG)}} \\quad \\text{Guaranteed Margins} = \\textcolor{#F59E0B}{\\text{?}}',
        options: [
          {
            id: 'a',
            latex: '\\text{LQG doubles LQR’s phase margin to } 120^\\circ \\text{ because the observer filters out disturbances}',
            correct: false,
            misconception:
              'Exactly the opposite! Adding observer dynamics in the loop can bend the Nyquist curve arbitrarily close to $-1 + j0$, collapsing margins near zero.',
          },
          {
            id: 'b',
            latex: '\\text{LQG keeps } \\ge 60^\\circ \\text{ phase margin as long as the Separation Principle holds}',
            correct: false,
            misconception:
              'Separation guarantees ONLY nominal eigenvalue stability under exact $(A,B,C)$ — it says NOTHING about robustness to plant gain/phase uncertainty!',
          },
          {
            id: 'c',
            latex: '\\text{Observer-based LQG has NO guaranteed gain or phase margins (margins can vanish arbitrarily close to zero), requiring explicit margin checks or LTR}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{LQG loses nominal stability whenever } C \\neq I',
            correct: false,
            misconception:
              'Nominal stability is 100% guaranteed by the Separation Principle; what vanishes is ROBUSTNESS margin against real-world plant modeling errors.',
          },
        ],
        lockedLabel: 'Doyle’s LQG Theorem',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{LQG has ZERO guaranteed margins} \\implies \\text{always verify loop margins / apply LTR}}',
        hint: 'Recall the shortest abstract in IEEE control theory history: "There are none."',
      },
    ],
  },

  {
    id: 'ss4-kalman-cycle',
    tier: 'observers-kf',
    tierLabel: 'Observers & Kalman',
    title: 'Discrete Kalman Filter Setup: Predict, Innovation, Gain K_k & Joseph Update',
    mechatronicsContext:
      'Every IMU-GPS navigator, autonomous gantry, and battery state-of-charge estimator relies on optimal Bayesian sensor fusion. Executing a complete Kalman predict-update cycle by hand locks in the exact role of $(F, B, H, Q, R)$, the Joseph numerical safeguard used in flight code, and the $Q/R$ tuning law.',
    expressionLatex:
      'F=1,\\; B=0.5,\\; H=1,\\; Q=1,\\; R=4,\\; z_1=14',
    finalAnswerLatex:
      '\\hat{x}_{1|0}=12,\\; P_{1|0}=4,\\; \\tilde{y}_1=+2,\\; S_1=8,\\; K_1=0.5,\\; \\hat{x}_1=13,\\; P_1=2 \\;(\\text{Joseph PSD})',
    diagram: {
      type: 'estimator-arch',
      variant: 'kf',
      model: 'F=1, B=0.5, Q=1',
      meas: 'H=1, R=4, z₁=14',
      noise: 'w~𝒩(0,Q), v~𝒩(0,R)',
      highlight: 'Joseph PSD Update',
      subtitle: 'Discrete Kalman Filter Cycle',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 5.0],
      setpoint: 13.0,
      setpointLabel: 'Posterior Fusion x̂₁ = 13.0',
      primaryLabel: 'Kalman Posterior x̂(t) (P₁=2)',
      baselineLabel: 'Noisy Sensor Readings z_k (R=4)',
      primaryFn: (t) => 13 - 3 * Math.exp(-1.1 * t) * Math.cos(0.4 * t),
      baselineFn: (t) =>
        13 + 1.65 * Math.sin(3.4 * t + 0.5) * Math.exp(-0.18 * t) - 1.1 * Math.exp(-0.8 * t),
      defaultCursor: 0.4,
      subtitle:
        'Hover across time $t$: optimal Kalman fusion (Emerald) weights prior prediction ($\\hat{x}_{1|0}=12,\\; P_{1|0}=4$) equally with the noisy measurement ($z_1=14,\\; R=4$) via $K_1=0.5$, cutting variance in half ($P_1=2 < 4$) while filtering raw sensor jitter (Cyan dashed).',
      domainMeta: 'Kalman Predict-Update · K₁ = 0.5 · Variance Halved (4 → 2)',
      metrics: [
        { label: 'Prior Predict', value: 'x̂₁|₀ = 12, P₁|₀ = 4' },
        { label: 'Innovation', value: 'ỹ₁ = +2, S₁ = 8' },
        { label: 'Kalman Gain', value: 'K₁ = 4/8 = 0.5' },
        { label: 'Posterior', value: 'x̂₁ = 13, P₁ = 2 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'kf_matrix_roles',
        badge: 'Map the 5 Kalman Filter Setup Matrices (F, B, H, Q, R)',
        whyThisStep:
          'Half of real-world Kalman filter bugs come from confusing process uncertainty $Q$ with sensor noise $R$ or putting units in $H$ wrong — cleanly mapping all five matrices makes every downstream equation automatic.',
        systemImpact:
          'In $\\mathbf{x}_k = F\\mathbf{x}_{k-1} + B\\mathbf{u}_{k-1} + \\mathbf{w}_{k-1}$ and $\\mathbf{z}_k = H\\mathbf{x}_k + \\mathbf{v}_k$, $(F, B, H)$ define deterministic physics while $(Q, R)$ quantify Gaussian uncertainty covariances!',
        prompt:
          'Match the five discrete Kalman Filter matrices $(F, B, H, Q, R)$ to their exact physical and stochastic meanings.',
        highlightLatex:
          '\\mathbf{x}_k = \\textcolor{#22D3EE}{F}\\mathbf{x}_{k-1} + \\textcolor{#22D3EE}{B}\\mathbf{u}_{k-1} + \\mathbf{w}_{k-1}\\;(\\textcolor{#F59E0B}{Q}), \\qquad \\mathbf{z}_k = \\textcolor{#22D3EE}{H}\\mathbf{x}_k + \\mathbf{v}_k\\;(\\textcolor{#F59E0B}{R})',
        options: [
          {
            id: 'a',
            latex: 'F\\text{: transition},\\; B\\text{: control},\\; H\\text{: sensor map},\\; Q=\\operatorname{Cov}(\\mathbf{w})\\text{: process noise},\\; R=\\operatorname{Cov}(\\mathbf{v})\\text{: sensor noise}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'F\\text{: sensor map},\\; H\\text{: transition},\\; Q\\text{: sensor noise},\\; R\\text{: process noise}',
            correct: false,
            misconception:
              'Swapped! $F$ advances state forward in time, $H$ maps state to sensor units, $Q$ is model/process noise covariance, and $R$ is measurement/sensor noise covariance.',
          },
          {
            id: 'c',
            latex: 'Q \\text{ and } R \\text{ are the LQR state and control penalty weights (arbitrary negative numbers allowed)}',
            correct: false,
            misconception:
              'Though mathematically dual to LQR, in a Kalman Filter $Q$ and $R$ are physical **noise covariance matrices** ($Q \\succeq 0,\\; R \\succ 0$) in squared physical units (e.g., $\\text{m}^2$)!',
          },
          {
            id: 'd',
            latex: 'Q \\text{ is the posterior state covariance } P_k, \\text{ and } R \\text{ is the Kalman gain } K_k',
            correct: false,
            misconception:
              '$P_k$ and $K_k$ are computed dynamically at every step from the model inputs $(F, B, H, Q, R)$.',
          },
        ],
        lockedLabel: 'KF Model Tuple',
        lockedResultLatex: '\\textcolor{#34D399}{(F, B, H)\\text{ physics}, \\quad Q=\\operatorname{Cov}(\\mathbf{w}), \\; R=\\operatorname{Cov}(\\mathbf{v})}',
        hint: 'Associate $Q$ with dynamics/process disturbance $\\mathbf{w}_k$ and $R$ with measurement reading noise $\\mathbf{v}_k$.',
      },
      {
        stepType: 'kf_predict',
        badge: 'Predict Step (Time Update): x̂₁|₀ & P₁|₀',
        whyThisStep:
          'Before reading the new sensor sample $z_1$, the filter propagates both its mean estimate AND its uncertainty ellipsoid forward through the dynamics — and uncertainty ALWAYS grows when process noise $Q > 0$ enters.',
        systemImpact:
          'Advancing the state gives $\\hat{x}_{1|0} = 12$, while propagating covariance through $F P_0 F^T + Q = 3 + 1 = 4$ honestly widens uncertainty before the sensor corrects it.',
        prompt:
          'Compute the prior predicted state $\\hat{x}_{1|0} = F\\hat{x}_0 + B u_0$ and predicted covariance $P_{1|0} = F P_0 F^T + Q$ given $F=1, B=0.5, Q=1, \\hat{x}_0=10, P_0=3, u_0=4$.',
        highlightLatex:
          '\\hat{x}_{1|0} = \\textcolor{#22D3EE}{1}(10) + \\textcolor{#22D3EE}{0.5}(4), \\qquad P_{1|0} = \\textcolor{#22D3EE}{1}(3)(1) + \\textcolor{#F59E0B}{1}',
        options: [
          {
            id: 'a',
            latex: '\\hat{x}_{1|0} = 12, \\qquad P_{1|0} = 3',
            correct: false,
            misconception:
              'Do not forget to add process noise $+Q = 1$! Without $+Q$, the filter becomes overconfident ($P \\to 0$) and eventually ignores all future sensor readings ("filter asleep").',
          },
          {
            id: 'b',
            latex: '\\hat{x}_{1|0} = 12, \\qquad P_{1|0} = 4',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\hat{x}_{1|0} = 14, \\qquad P_{1|0} = 4',
            correct: false,
            misconception:
              'Multiply $B u_0 = (0.5)(4) = 2$, giving $\\hat{x}_{1|0} = 10 + 2 = 12$ ($14$ is the sensor reading $z_1$, which enters only in the update step!).',
          },
          {
            id: 'd',
            latex: '\\hat{x}_{1|0} = 12, \\qquad P_{1|0} = 7',
            correct: false,
            misconception:
              'Only process noise $Q = 1$ enters the predict covariance ($P_{1|0} = 3 + 1 = 4$); sensor noise $R = 4$ enters only in the innovation covariance $S_1$!',
          },
        ],
        lockedLabel: 'Prior Prediction',
        lockedResultLatex: '\\hat{x}_{1|0} = \\textcolor{#34D399}{12}, \\qquad P_{1|0} = \\textcolor{#34D399}{4}',
        hint: 'Evaluate $10 + 0.5(4)$ for the mean and $3 + Q$ for the predicted variance.',
      },
      {
        stepType: 'kf_innovation',
        badge: 'Innovation ỹ₁ & Innovation Covariance S₁',
        whyThisStep:
          'The innovation $\\tilde{y}_1 = z_1 - H\\hat{x}_{1|0}$ measures the "surprise" in the new sensor reading, and $S_1 = H P_{1|0} H^T + R$ is its total expected variance (also used for Mahalanobis $\\chi^2$ outlier gating!).',
        systemImpact:
          'Here the sensor reads $+2$ units above our prediction ($\\tilde{y}_1 = +2$) against a combined prediction+sensor variance of $S_1 = 4 + 4 = 8$ — well within $1\\sigma$ ($\\sqrt{8} \\approx 2.83$), confirming a healthy inlier reading!',
        prompt:
          'With measurement $z_1 = 14$, $H = 1$, $R = 4$, and prior $(\\hat{x}_{1|0}=12,\\; P_{1|0}=4)$, compute the innovation $\\tilde{y}_1$ and innovation covariance $S_1$.',
        highlightLatex:
          '\\tilde{y}_1 = \\textcolor{#F59E0B}{z_1} - H\\hat{x}_{1|0}, \\qquad S_1 = H\\textcolor{#22D3EE}{P_{1|0}}H^T + \\textcolor{#F59E0B}{R}',
        options: [
          {
            id: 'a',
            latex: '\\tilde{y}_1 = -2, \\qquad S_1 = 8',
            correct: false,
            misconception:
              'Always subtract prediction from measurement: $\\tilde{y}_1 = z_1 - H\\hat{x}_{1|0} = 14 - 12 = +2$ so $+K_1\\tilde{y}_1$ nudges $\\hat{x}$ TOWARD $z_1$.',
          },
          {
            id: 'b',
            latex: '\\tilde{y}_1 = +2, \\qquad S_1 = 4',
            correct: false,
            misconception:
              'Innovation covariance adds BOTH projected state uncertainty $H P_{1|0} H^T = 4$ AND sensor noise $R = 4$, giving $S_1 = 8$.',
          },
          {
            id: 'c',
            latex: '\\tilde{y}_1 = +2, \\qquad S_1 = 8',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\tilde{y}_1 = +4, \\qquad S_1 = 7',
            correct: false,
            misconception:
              'Compare $z_1 = 14$ against the PREDICTED state $\\hat{x}_{1|0} = 12$ (not old $\\hat{x}_0 = 10$), and use $P_{1|0} = 4$ (not $P_0 = 3$).',
          },
        ],
        lockedLabel: 'Innovation & S₁',
        lockedResultLatex: '\\tilde{y}_1 = \\textcolor{#34D399}{+2}, \\qquad S_1 = \\textcolor{#34D399}{8}',
        hint: 'Compute $14 - 12$ and $4 + 4$.',
      },
      {
        stepType: 'kf_gain',
        badge: 'Compute Optimal Kalman Gain K₁ = P₁|₀ Hᵀ S₁⁻¹',
        whyThisStep:
          'The Kalman gain $K_k$ is the exact Minimum Mean-Square Error (MMSE) weighting ratio between how uncertain our prediction is ($P_{1|0}$) and how uncertain the innovation is ($S_1 = H P_{1|0} H^T + R$).',
        systemImpact:
          'Because predicted uncertainty ($P_{1|0} = 4$) and sensor noise ($R = 4$) are equal, $K_1 = \\frac{4}{4+4} = 0.5$ splits trust exactly $50/50$ between the dynamics model and the sensor!',
        prompt:
          'Compute the optimal Kalman gain $K_1 = P_{1|0} H^T S_1^{-1}$ using $P_{1|0} = 4$, $H = 1$, and $S_1 = 8$.',
        highlightLatex:
          'K_1 = \\textcolor{#22D3EE}{P_{1|0}} H^T \\textcolor{#F59E0B}{S_1^{-1}} = \\frac{4 \\cdot 1}{4 + 4}',
        options: [
          {
            id: 'a',
            latex: 'K_1 = 2',
            correct: false,
            misconception:
              'Inverted ratio! $K_1 = P_{1|0} / S_1 = 4/8 = 0.5$, not $S_1 / P_{1|0}$. For $H = 1$, $K_k$ always lies strictly in $[0, 1]$!',
          },
          {
            id: 'b',
            latex: 'K_1 = 0.5',
            correct: true,
          },
          {
            id: 'c',
            latex: 'K_1 = 0.25',
            correct: false,
            misconception:
              'Check the numerator: it is $P_{1|0} = 4$ (not $Q = 1$), so $K_1 = 4/8 = 0.5$.',
          },
          {
            id: 'd',
            latex: 'K_1 = 1',
            correct: false,
            misconception:
              '$K_1 = 1$ only occurs for a noiseless sensor ($R = 0$); here $R = 4$ tempers trust in $z_1$ down to $0.5$.',
          },
        ],
        lockedLabel: 'Optimal Gain K₁',
        lockedResultLatex: 'K_1 = \\frac{4}{8} = \\textcolor{#34D399}{0.5}',
        hint: 'Divide $P_{1|0} = 4$ by $S_1 = 8$.',
      },
      {
        stepType: 'kf_posterior',
        badge: 'Compute Posterior Estimate x̂₁ & Covariance P₁',
        whyThisStep:
          'Fusing the prior with the innovation shifts the mean toward the sensor AND strictly shrinks the posterior covariance below BOTH the prior variance and the sensor variance.',
        systemImpact:
          'Obtaining $\\hat{x}_1 = 13$ and $P_1 = 2$ proves the magic of Gaussian fusion: even when BOTH model ($P_{1|0}=4$) and sensor ($R=4$) are noisy, their optimal combination cuts variance in half ($P_1 = 2$)!',
        prompt:
          'Compute the posterior state $\\hat{x}_1 = \\hat{x}_{1|0} + K_1 \\tilde{y}_1$ and posterior covariance $P_1 = (I - K_1 H) P_{1|0}$.',
        highlightLatex:
          '\\hat{x}_1 = 12 + \\textcolor{#34D399}{0.5}(\\textcolor{#F59E0B}{2}), \\qquad P_1 = (1 - \\textcolor{#34D399}{0.5}\\cdot 1)(\\textcolor{#22D3EE}{4})',
        options: [
          {
            id: 'a',
            latex: '\\hat{x}_1 = 13, \\qquad P_1 = 2 \\;(\\text{strictly tighter than both } P_{1|0}=4 \\text{ and } R=4)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\hat{x}_1 = 13, \\qquad P_1 = 4',
            correct: false,
            misconception:
              'Measurement fusion ALWAYS reduces uncertainty when $K_1 > 0$: $P_1 = (1 - 0.5)(4) = 2$, half the prior variance!',
          },
          {
            id: 'c',
            latex: '\\hat{x}_1 = 14, \\qquad P_1 = 2',
            correct: false,
            misconception:
              'Adding $K_1 \\tilde{y}_1 = 0.5(2) = 1$ to $\\hat{x}_{1|0} = 12$ lands right in the middle at $\\hat{x}_1 = 13$, not all the way at $z_1 = 14$.',
          },
          {
            id: 'd',
            latex: '\\hat{x}_1 = 11, \\qquad P_1 = 6',
            correct: false,
            misconception:
              'Watch both signs: $+K_1\\tilde{y}_1$ moves $12$ UP toward $14$ ($12 + 1 = 13$), and $(1 - K_1 H)P_{1|0}$ SHRINKS variance ($4 \\to 2$).',
          },
        ],
        lockedLabel: 'Posterior (x̂₁, P₁)',
        lockedResultLatex: '\\hat{x}_1 = \\textcolor{#34D399}{13}, \\qquad P_1 = \\textcolor{#34D399}{2 < \\min(4, 4)}',
        hint: 'Evaluate $12 + 0.5(2)$ and $(1 - 0.5) \\times 4$.',
      },
      {
        stepType: 'kf_joseph_form',
        badge: 'Numerical Flight-Code Upgrade: Joseph Stabilized Form',
        whyThisStep:
          'The textbook shortcut $P_k = (I - K_k H)P^-$ subtracts two nearly equal matrices in floating point — on embedded 32-bit float flight controllers, rounding errors can make $P_k$ asymmetric or produce negative eigenvalues, crashing the estimator!',
        systemImpact:
          'The **Joseph form** $P_k = (I - K_k H) P^- (I - K_k H)^T + K_k R K_k^T$ is a sum of two symmetric positive-semidefinite quadratic forms (check here: $0.5^2(4) + 0.5^2(4) = 2$), preserving exact symmetry and PSD stability even for suboptimal $K_k$!',
        prompt:
          'Why do production aerospace and robotics Kalman Filters replace $P_k = (I - K_k H) P^-$ with the **Joseph stabilized covariance update**?',
        highlightLatex:
          'P_k = \\underbrace{(I - K_k H)\\,\\textcolor{#22D3EE}{P^-}\\,(I - K_k H)^T}_{\\textcolor{#34D399}{\\text{Symmetric PSD}}} + \\underbrace{K_k\\,\\textcolor{#F59E0B}{R}\\,K_k^T}_{\\textcolor{#34D399}{\\text{Symmetric PSD}}}',
        options: [
          {
            id: 'a',
            latex: '\\text{It requires fewer floating-point multiplications than } (I - K_k H)P^-',
            correct: false,
            misconception:
              'Joseph form actually costs MORE multiplications — engineers gladly pay the small extra FLOPs for ironclad numerical PSD stability!',
          },
          {
            id: 'b',
            latex: '\\text{It sums two symmetric PSD quadratic forms, preventing floating-point subtraction from losing symmetry or creating negative eigenvalues (and holds even for non-optimal } K_k)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{It gives a completely different exact mathematical value of } P_k \\text{ than } (I - K_k H)P^-',
            correct: false,
            misconception:
              'In exact arithmetic with the optimal $K_k$, both formulas give the EXACT same number ($0.25(4)+0.25(4)=2$)! Joseph form simply avoids catastrophic floating-point cancellation.',
          },
          {
            id: 'd',
            latex: '\\text{It eliminates the need to invert the innovation covariance } S_k',
            correct: false,
            misconception:
              'Computing $K_k = P^- H^T S_k^{-1}$ still solves against $S_k$; Joseph form specifically stabilizes the covariance update step.',
          },
        ],
        lockedLabel: 'Joseph Stabilized Form',
        lockedResultLatex: '\\textcolor{#34D399}{P_k = (I-K_k H)P^-(I-K_k H)^T + K_k R K_k^T \\succeq 0}',
        hint: 'Notice every term has the quadratic congruence form $M\\Sigma M^T$ with $\\Sigma \\succeq 0$, with zero matrix subtraction.',
      },
      {
        stepType: 'kf_qr_tuning',
        badge: 'Master the Q/R Tuning Law',
        whyThisStep:
          'In practice, sensor datasheets give a ballpark $R$, while unmodeled friction and wind gusts make $Q$ your primary tuning knob — knowing both extremes lets you diagnose lag vs. jitter in seconds on a live robot.',
        systemImpact:
          'Increasing $R/Q$ pulls $K_k \\to 0$ (trusts model: silky-smooth output, sluggish lag to sudden disturbances), while increasing $Q/R$ pushes $K_k \\to H^{-1}$ (trusts sensor: instant tracking, noisy jagged estimates)!',
        prompt:
          'What happens to the steady-state Kalman gain $K_k$ and estimation behavior in the two tuning extremes $R \\gg Q$ versus $Q \\gg R$?',
        highlightLatex:
          'K_k = \\frac{P^- H^T}{H P^- H^T + \\textcolor{#F59E0B}{R}} \\qquad (P^- = F P F^T + \\textcolor{#22D3EE}{Q})',
        options: [
          {
            id: 'a',
            latex: 'R \\gg Q \\implies K_k \\to H^{-1}\\;(\\text{trust sensor}); \\qquad Q \\gg R \\implies K_k \\to 0\\;(\\text{trust model})',
            correct: false,
            misconception:
              'Exactly reversed! Huge $R$ means the SENSOR is super noisy, so the filter shrinks $K_k \\to 0$ and trusts the model instead.',
          },
          {
            id: 'b',
            latex: '\\text{Scaling both } Q \\text{ and } R \\text{ by } 10\\times \\text{ multiplies the steady-state Kalman gain } K_k \\text{ by } 10\\times',
            correct: false,
            misconception:
              'Steady-state $K_k$ depends ONLY on the RATIO $Q/R$! Multiplying both $Q$ and $R$ by $10$ multiplies $P$ by $10$ while leaving $K_k$ completely unchanged.',
          },
          {
            id: 'c',
            latex: 'R \\gg Q \\implies K_k \\to 0\\;(\\text{trust model, smooth but sluggish lag}); \\quad Q \\gg R \\implies K_k \\to H^{-1}\\;(\\text{trust sensor, fast but noisy})',
            correct: true,
          },
          {
            id: 'd',
            latex: 'Q = 0 \\text{ always gives the fastest disturbance rejection because the model is assumed exact}',
            correct: false,
            misconception:
              'Setting $Q = 0$ drives $P_k \\to 0$ and $K_k \\to 0$ — the filter becomes totally blind to any unmodeled bump or drift ("filter divergence")!',
          },
        ],
        lockedLabel: 'Q/R Tuning Trade-off',
        lockedResultLatex: '\\textcolor{#34D399}{R \\gg Q \\Rightarrow K\\to 0\\;(\\text{smooth/lag}); \\quad Q \\gg R \\Rightarrow K\\to H^{-1}\\;(\\text{fast/noisy})}',
        hint: 'Ask: if $R \\to \\infty$ (terrible sensor), should $K_k$ weight the sensor heavily or ignore it?',
      },
    ],
  },

  {
    id: 'ss4-ekf-vs-ukf',
    tier: 'observers-kf',
    tierLabel: 'Observers & Kalman',
    title: 'Nonlinear Estimation: EKF Failure Modes & UKF Sigma-Point Setup',
    mechatronicsContext:
      'Range-bearing radars, UWB beacons, and robotic kinematics are inherently nonlinear. Computing an EKF Jacobian alongside a 1D quadratic transform exposes why first-order Taylor linearization catastrophically collapses variance — and why the derivative-free Unscented Kalman Filter (UKF) nails the exact mean without a single Jacobian!',
    expressionLatex:
      'r=\\sqrt{x_1^2+x_2^2},\\; y=x^2\\;(\\hat{x}=0, P=1)',
    finalAnswerLatex:
      'H=\\begin{bmatrix}\\frac{x_1}{r}&\\frac{x_2}{r}\\end{bmatrix}, \\quad \\hat{y}_{\\text{EKF}}=0\\;(\\text{biased!}), \\quad \\mathcal{X}=\\{0,\\pm\\sqrt{2}\\} \\implies \\hat{y}_{\\text{UKF}}=1\\;(\\text{exact!})',
    diagram: {
      type: 'estimator-arch',
      variant: 'ukf',
      model: '2n+1 Sigma Pts',
      meas: 'y=x², r=√(x₁²+x₂²)',
      noise: 'Cholesky √((n+λ)P)',
      highlight: 'No Jacobians Needed',
      subtitle: 'Unscented Sigma-Point Propagation',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 4.0],
      setpoint: 1.0,
      setpointLabel: 'True Nonlinear Mean E[x²] = 1.0',
      primaryLabel: 'UKF Sigma-Point Estimate (Exact)',
      baselineLabel: 'Naive EKF Linearization (Biased)',
      primaryFn: (t) => 1 - 0.85 * Math.exp(-1.55 * t) * Math.cos(0.9 * t),
      baselineFn: (t) => 0.35 * (1 - Math.exp(-1.2 * t)),
      defaultCursor: 0.45,
      subtitle:
        'Hover across time $t$: propagating $2n+1$ deterministic sigma points lets the UKF (Emerald) converge directly to the true nonlinear mean $\\mathbb{E}[x^2]=1$, while naive EKF first-order linearization (Cyan dashed) suffers persistent bias and variance collapse whenever curvature $h^{\'\'}(\\hat{x}) \\neq 0$.',
      domainMeta: 'Nonlinear Fusion · UKF Exact 2nd-Order Moments vs Biased EKF',
      metrics: [
        { label: 'Range Jacobian', value: 'H = [x₁/r, x₂/r]' },
        { label: 'EKF on y=x²', value: 'ŷ=0, P_yy=0 (FAIL!)' },
        { label: 'UKF Sigma Pts', value: '𝒳 = {0, ±√2}' },
        { label: 'UKF Mean ŷ', value: '1.000 (Exact!) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ekf_jacobian',
        badge: 'Compute EKF Measurement Jacobian H_k',
        whyThisStep:
          'The Extended Kalman Filter (EKF) locally linearizes nonlinear sensors $z = h(\\mathbf{x}) + v$ via first-order Taylor expansion using the Jacobian matrix $H_k = \\left.\\frac{\\partial h}{\\partial \\mathbf{x}}\\right|_{\\hat{\\mathbf{x}}}$.',
        systemImpact:
          'For a range beacon $r = \\sqrt{x_1^2 + x_2^2}$, the Jacobian $H = [\\frac{x_1}{r},\\; \\frac{x_2}{r}]$ is the exact unit line-of-sight vector — revealing immediately that a single range measurement shrinks uncertainty ONLY along the radial line to the beacon (and goes singular at $r = 0$)!',
        prompt:
          'Compute the $1 \\times 2$ EKF measurement Jacobian $H = \\left[\\frac{\\partial h}{\\partial x_1}\\;\\; \\frac{\\partial h}{\\partial x_2}\\right]$ for the 2D range sensor $h(x_1, x_2) = \\sqrt{x_1^2 + x_2^2} = r$.',
        highlightLatex:
          'h(x_1, x_2) = (x_1^2 + x_2^2)^{1/2} = \\textcolor{#22D3EE}{r} \\implies H = \\frac{\\partial h}{\\partial \\mathbf{x}}',
        options: [
          {
            id: 'a',
            latex: 'H = \\begin{bmatrix} 2x_1 & 2x_2 \\end{bmatrix}',
            correct: false,
            misconception:
              'You differentiated $x_1^2 + x_2^2$ without applying the outer chain rule $\\frac{1}{2}(x_1^2+x_2^2)^{-1/2}$ — the factor of $2$ cancels $\\frac{1}{2}$, leaving $\\frac{x_i}{r}$.',
          },
          {
            id: 'b',
            latex: 'H = \\begin{bmatrix} \\dfrac{x_1}{r} & \\dfrac{x_2}{r} \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'H = \\begin{bmatrix} \\dfrac{x_1}{r^2} & \\dfrac{x_2}{r^2} \\end{bmatrix}',
            correct: false,
            misconception:
              'Check the exponent: $(x_1^2+x_2^2)^{-1/2} = \\frac{1}{r}$, NOT $\\frac{1}{r^2}$! The Jacobian of distance must be dimensionless (unit vector).',
          },
          {
            id: 'd',
            latex: 'H = \\begin{bmatrix} -\\dfrac{x_2}{r^2} & \\dfrac{x_1}{r^2} \\end{bmatrix}',
            correct: false,
            misconception:
              'That is the Jacobian of BEARING angle $\\theta = \\operatorname{atan2}(x_2, x_1)$, not RANGE $r = \\sqrt{x_1^2+x_2^2}$!',
          },
        ],
        lockedLabel: 'Range Jacobian H',
        lockedResultLatex: 'H = \\textcolor{#34D399}{\\begin{bmatrix} \\frac{x_1}{r} & \\frac{x_2}{r} \\end{bmatrix}} \\quad (\\text{unit radial vector})',
        hint: 'Apply the chain rule: $\\frac{\\partial}{\\partial x_i}(x_1^2+x_2^2)^{1/2} = \\frac{1}{2}(x_1^2+x_2^2)^{-1/2}(2x_i)$.',
      },
      {
        stepType: 'ekf_failure_mode',
        badge: 'Expose Why Naive EKF Fails on Curved Sensors (y = x²)',
        whyThisStep:
          'Seeing a concrete 1-line counterexample where EKF fails completely makes its linearization flaw unforgettable: whenever a sensor has strong curvature ($h^{\\prime\\prime} \\neq 0$), a local tangent line misses the entire distribution!',
        systemImpact:
          'At $\\hat{x} = 0,\\; P = 1$, EKF evaluates $H = 2\\hat{x} = 0$ and predicts $\\hat{y}_{\\text{EKF}} = 0,\\; P_{yy} = 0$ — completely missing the true mean $\\mathbb{E}[x^2] = 1$ and collapsing predicted variance to ZERO!',
        prompt:
          'Let $x \\sim \\mathcal{N}(\\hat{x}=0,\\; P=1)$ pass through the nonlinear map $y = x^2$. Compare the EKF tangent-line prediction $(\\hat{y}_{\\text{EKF}},\\; P_{yy}^{\\text{EKF}})$ against the true mean $\\mathbb{E}[x^2]$.',
        highlightLatex:
          'y = x^2,\\quad H = \\left.\\frac{dy}{dx}\\right|_{\\hat{x}=0} = \\textcolor{#F59E0B}{2(0) = 0} \\implies \\hat{y}_{\\text{EKF}} = h(0),\\; P_{yy}^{\\text{EKF}} = H P H^T',
        options: [
          {
            id: 'a',
            latex: '\\hat{y}_{\\text{EKF}} = 1,\\; P_{yy}^{\\text{EKF}} = 2 \\;(\\text{matches true moments identically})',
            correct: false,
            misconception:
              'EKF only evaluates $h(\\hat{x}) = 0^2 = 0$ and $H P H^T = 0\\cdot 1\\cdot 0 = 0$; it completely ignores the second-order curvature $h^{\'\'}(0) = 2$!',
          },
          {
            id: 'b',
            latex: '\\hat{y}_{\\text{EKF}} = 0,\\; P_{yy}^{\\text{EKF}} = 0, \\text{ whereas true } \\mathbb{E}[x^2] = 1\\;(\\text{100\\% bias \\& catastrophic variance collapse!})',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\hat{y}_{\\text{EKF}} = 0,\\; P_{yy}^{\\text{EKF}} = 1, \\text{ whereas true } \\mathbb{E}[x^2] = 0',
            correct: false,
            misconception:
              'Since $x^2 \\ge 0$ everywhere and $\\operatorname{Var}(x) = \\mathbb{E}[x^2] - (\\mathbb{E}[x])^2$, the true mean is $\\mathbb{E}[x^2] = 0^2 + 1 = 1$, NOT $0$! And $H P H^T = 0$, NOT $1$.',
          },
          {
            id: 'd',
            latex: '\\text{EKF fails only because } x^2 \\text{ is non-differentiable at } x = 0',
            correct: false,
            misconception:
              '$y = x^2$ is infinitely smooth ($C^\\infty$)! EKF fails purely because the local slope $H = 0$ throws away all second-order curvature across the $\\pm 1\\sigma$ spread.',
          },
        ],
        lockedLabel: 'EKF Linearization Trap',
        lockedResultLatex: '\\textcolor{#F59E0B}{\\hat{y}_{\\text{EKF}}=0,\\; P_{yy}^{\\text{EKF}}=0} \\;\\neq\\; \\textcolor{#34D399}{\\mathbb{E}[x^2]=1}',
        hint: 'Plug $\\hat{x}=0$ into $h(\\hat{x})=\\hat{x}^2$ and $H = 2\\hat{x}$, then compare against $\\mathbb{E}[x^2] = \\hat{x}^2 + P$.',
      },
      {
        stepType: 'ukf_sigma_points',
        badge: 'Generate the 2n + 1 UKF Sigma Points & Weights',
        whyThisStep:
          'The Unscented Transform follows a brilliant maxim: *"It is easier to approximate a probability distribution than to approximate an arbitrary nonlinear function."* Picking $2n+1$ deterministic sigma points captures the exact mean and covariance of $x$ before propagation!',
        systemImpact:
          'For $n = 1,\\; \\lambda = 1,\\; \\hat{x} = 0,\\; P = 1$, placing $\\mathcal{X} = \\{0,\\; +\\sqrt{2},\\; -\\sqrt{2}\\}$ with weights $W_0 = \\frac{1}{2},\\; W_{1,2} = \\frac{1}{4}$ matches $\\sum W_i \\mathcal{X}_i = 0$ and $\\sum W_i \\mathcal{X}_i^2 = 1$ identically!',
        prompt:
          'For $n = 1$ state with $\\hat{x} = 0,\\; P = 1$ and scaling parameter $\\lambda = 1$, compute the $2n + 1 = 3$ UKF sigma points $\\mathcal{X}_0 = \\hat{x}$, $\\mathcal{X}_{1,2} = \\hat{x} \\pm \\sqrt{(n+\\lambda)P}$ and weights $W_0 = \\frac{\\lambda}{n+\\lambda},\\; W_{1,2} = \\frac{1}{2(n+\\lambda)}$.',
        highlightLatex:
          '\\mathcal{X}_{1,2} = \\hat{x} \\pm \\sqrt{(\\textcolor{#22D3EE}{1} + \\textcolor{#F59E0B}{1})\\,\\textcolor{#22D3EE}{P}}, \\qquad W_0 = \\frac{\\lambda}{n+\\lambda},\\quad W_{1,2} = \\frac{1}{2(n+\\lambda)}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{X} = \\{0,\\; +1,\\; -1\\}, \\qquad W = \\{\\tfrac{1}{3},\\; \\tfrac{1}{3},\\; \\tfrac{1}{3}\\}',
            correct: false,
            misconception:
              'Check the sample variance of those points: $\\frac{1}{3}(0) + \\frac{1}{3}(1) + \\frac{1}{3}(1) = \\frac{2}{3} \\neq 1$! Placing them at $\\pm\\sqrt{(n+\\lambda)P} = \\pm\\sqrt{2}$ with $W = \\{\\frac{1}{2}, \\frac{1}{4}, \\frac{1}{4}\\}$ preserves exact variance $P = 1$.',
          },
          {
            id: 'b',
            latex: '\\mathcal{X} = \\{0,\\; +2,\\; -2\\}, \\qquad W = \\{\\tfrac{1}{2},\\; \\tfrac{1}{4},\\; \\tfrac{1}{4}\\}',
            correct: false,
            misconception:
              'Remember the square root (Cholesky factor in $n$D): $\\sqrt{(1+1)\\cdot 1} = \\sqrt{2}$, NOT $2$!',
          },
          {
            id: 'c',
            latex: '\\mathcal{X} = \\{0,\\; +\\sqrt{2},\\; -\\sqrt{2}\\}, \\qquad W_0 = \\tfrac{1}{2},\\; W_1 = W_2 = \\tfrac{1}{4}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathcal{X} = \\{+\\sqrt{2},\\; -\\sqrt{2}\\}, \\qquad W_1 = W_2 = \\tfrac{1}{4}',
            correct: false,
            misconception:
              'Never drop the center sigma point $\\mathcal{X}_0 = \\hat{x}$ — without $W_0 = \\frac{1}{2}$, the weights sum to $0.5 \\neq 1$!',
          },
        ],
        lockedLabel: 'UKF Sigma Points',
        lockedResultLatex: '\\mathcal{X} = \\textcolor{#34D399}{\\{0,\\; +\\sqrt{2},\\; -\\sqrt{2}\\}}, \\quad W = \\textcolor{#34D399}{\\{\\tfrac{1}{2},\\; \\tfrac{1}{4},\\; \\tfrac{1}{4}\\}}',
        hint: 'Plug $n=1, \\lambda=1, P=1$ into $\\sqrt{(n+\\lambda)P}$ and the weight denominators $n+\\lambda = 2$.',
      },
      {
        stepType: 'ukf_propagate_mean',
        badge: 'Propagate Sigma Points Through True y = x²',
        whyThisStep:
          'Passing each sigma point directly through the TRUE nonlinear function $h(\\cdot)$ requires ZERO analytic derivatives and automatically captures second-order curvature shifts!',
        systemImpact:
          'Evaluating $\\mathcal{Y} = \\{0, 2, 2\\}$ yields $\\hat{y}_{\\text{UKF}} = \\frac{1}{2}(0) + \\frac{1}{4}(2) + \\frac{1}{4}(2) = 1.000$ — hitting the exact true mean $\\mathbb{E}[x^2] = 1$ with ZERO Jacobians and non-zero covariance $P_{yy} = 1$!',
        prompt:
          'Pass each sigma point $\\mathcal{X} = \\{0,\\; +\\sqrt{2},\\; -\\sqrt{2}\\}$ through the exact nonlinear map $\\mathcal{Y}_i = \\mathcal{X}_i^2$ and compute the UKF weighted mean $\\hat{y}_{\\text{UKF}} = \\sum_{i=0}^2 W_i \\mathcal{Y}_i$.',
        highlightLatex:
          '\\mathcal{Y}_i = \\mathcal{X}_i^2 = \\{0,\\; \\textcolor{#22D3EE}{2},\\; \\textcolor{#22D3EE}{2}\\}, \\qquad \\hat{y}_{\\text{UKF}} = \\frac{1}{2}(0) + \\frac{1}{4}(2) + \\frac{1}{4}(2)',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{Y} = \\{0,\\; 2,\\; -2\\} \\implies \\hat{y}_{\\text{UKF}} = 0',
            correct: false,
            misconception:
              'Squaring a negative number is POSITIVE: $(-\\sqrt{2})^2 = +2$, NOT $-2$!',
          },
          {
            id: 'b',
            latex: '\\mathcal{Y} = \\{0,\\; 2,\\; 2\\} \\implies \\hat{y}_{\\text{UKF}} = 1\\;(\\text{exact true mean } \\mathbb{E}[x^2] = 1!)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{Y} = \\{0,\\; 2,\\; 2\\} \\implies \\hat{y}_{\\text{UKF}} = \\tfrac{4}{3}',
            correct: false,
            misconception:
              'Use the UKF weights $W = \\{\\frac{1}{2}, \\frac{1}{4}, \\frac{1}{4}\\}$ (not unweighted average $\\frac{1}{3}$): $\\frac{1}{2}(0) + \\frac{1}{4}(2) + \\frac{1}{4}(2) = 1$.',
          },
          {
            id: 'd',
            latex: '\\mathcal{Y} = \\{0,\\; 4,\\; 4\\} \\implies \\hat{y}_{\\text{UKF}} = 2',
            correct: false,
            misconception:
              '$(\\pm\\sqrt{2})^2 = 2$, not $4$!',
          },
        ],
        lockedLabel: 'Exact UKF Mean',
        lockedResultLatex: '\\hat{y}_{\\text{UKF}} = \\textcolor{#34D399}{1.000} \\quad (\\text{Exact! vs. EKF } \\hat{y}_{\\text{EKF}} = 0)',
        hint: 'Square each sigma point ($0, 2, 2$) and multiply by weights $(\\frac{1}{2}, \\frac{1}{4}, \\frac{1}{4})$.',
      },
      {
        stepType: 'ukf_cross_cov_gain',
        badge: 'Assemble UKF Cross-Covariance P_xz & Gain K_k',
        whyThisStep:
          'Because UKF never computes a measurement Jacobian $H_k$, it replaces $P^- H^T$ with the empirical sample cross-covariance $P_{xz}$ between state sigma points and predicted measurement sigma points!',
        systemImpact:
          'Computing $K_k = P_{xz} P_{zz}^{-1}$ directly from sigma-point outer products closes the entire Bayesian measurement update completely derivative-free.',
        prompt:
          'Select the exact UKF cross-covariance $P_{xz}$, innovation covariance $P_{zz}$, and derivative-free Kalman gain $K_k$ formulas.',
        highlightLatex:
          '\\text{EKF: } K_k = (\\textcolor{#22D3EE}{P^- H^T})(\\textcolor{#F59E0B}{H P^- H^T + R})^{-1} \\quad \\xrightarrow{\\text{UKF}} \\quad K_k = \\textcolor{#34D399}{P_{xz}\\,P_{zz}^{-1}}',
        options: [
          {
            id: 'a',
            latex: 'P_{xz} = \\sum W_i^{(c)}(\\mathcal{X}_i-\\hat{\\mathbf{x}})(\\mathcal{Z}_i-\\hat{\\mathbf{z}})^T, \\quad P_{zz} = \\sum W_i^{(c)}(\\mathcal{Z}_i-\\hat{\\mathbf{z}})(\\mathcal{Z}_i-\\hat{\\mathbf{z}})^T + R, \\quad K_k = P_{xz}P_{zz}^{-1}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'P_{xz} = \\sum W_i^{(c)}(\\mathcal{X}_i-\\hat{\\mathbf{x}})(\\mathcal{X}_i-\\hat{\\mathbf{x}})^T, \\quad K_k = P_{xz} R^{-1}',
            correct: false,
            misconception:
              'That computes $P_{xx}$ (state covariance), not cross-covariance $P_{xz}$ with measurements $\\mathcal{Z}_i$, and omits the projected state variance inside $P_{zz}$!',
          },
          {
            id: 'c',
            latex: 'K_k = P_{zz} P_{xz}^{-1} \\;(\\text{inverted cross-covariance})',
            correct: false,
            misconception:
              'Dimensions and direction are reversed: $P_{xz}$ is $n \\times m$ (usually non-square!) and $P_{zz}$ is symmetric $m \\times m$ PD, so $K_k = P_{xz} P_{zz}^{-1}$ ($n \\times m$).',
          },
          {
            id: 'd',
            latex: 'P_{zz} = \\sum W_i^{(c)}(\\mathcal{Z}_i-\\hat{\\mathbf{z}})(\\mathcal{Z}_i-\\hat{\\mathbf{z}})^T \\text{ (no } +R \\text{ needed)}',
            correct: false,
            misconception:
              'Sigma points propagate only state uncertainty through $h(\\mathcal{X}_i)$ — you MUST still add additive sensor noise $+R$ to form total innovation covariance $P_{zz}$!',
          },
        ],
        lockedLabel: 'Derivative-Free Gain',
        lockedResultLatex: '\\textcolor{#34D399}{P_{xz}=\\sum W_i^{(c)}\\Delta\\mathcal{X}_i\\Delta\\mathcal{Z}_i^T, \\quad K_k = P_{xz}P_{zz}^{-1}}',
        hint: 'Match the dimensions of $P^- H^T$ ($n \\times m$) to $P_{xz}$ and $S_k = H P^- H^T + R$ ($m \\times m$) to $P_{zz}$.',
      },
      {
        stepType: 'ekf_vs_ukf_tradeoff',
        badge: 'Engineering Trade-Off: EKF vs. UKF / SR-UKF in Robotics',
        whyThisStep:
          'Senior engineers do not blindly swap every EKF for a UKF — knowing the exact accuracy order, Cholesky scaling cost, and Square-Root UKF (SR-UKF) upgrade lets you pick the right filter for your CPU budget.',
        systemImpact:
          'UKF/CKF achieve **2nd-to-3rd-order Taylor moment accuracy** with zero Jacobians (ideal for nonlinear drag, batteries, radar), while **SR-UKF** propagates Cholesky factor $S$ ($P = SS^T$) directly to guarantee PSD stability at the same $O(n^3)$ cost!',
        prompt:
          'Compare EKF against UKF / Square-Root UKF (SR-UKF) for modern embedded mechatronics systems.',
        highlightLatex:
          '\\text{EKF: } O(n^3)\\text{ + analytic Jacobians (1st order)} \\quad \\text{vs.} \\quad \\text{UKF / SR-UKF: } O(n^3)\\text{ Cholesky (2nd/3rd order)}',
        options: [
          {
            id: 'a',
            latex: '\\text{UKF eliminates the Gaussian assumption completely and tracks arbitrary multi-modal distributions}',
            correct: false,
            misconception:
              'UKF is STILL a unimodal Gaussian filter! For truly multi-modal distributions (e.g., kidnapped-robot global localization), you need a **Particle Filter (SMC)**.',
          },
          {
            id: 'b',
            latex: '\\text{UKF achieves 2nd/3rd-order moment accuracy without Jacobians (at } O(n^3) \\text{ Cholesky cost per step), and SR-UKF propagates } \\sqrt{P} \\text{ for guaranteed PSD stability}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{UKF has exponential } O(2^n) \\text{ sigma points, so it cannot run above } n = 3 \\text{ states}',
            correct: false,
            misconception:
              'Grid/quadrature rules grow exponentially, NOT UKF! UKF uses only $2n + 1$ points (linear in $n$ — e.g., just 31 points for a 15-state IMU!), with $O(n^3)$ Cholesky cost identical in order to EKF.',
          },
          {
            id: 'd',
            latex: '\\text{EKF is always more accurate than UKF because analytic derivatives are exact}',
            correct: false,
            misconception:
              'An exact 1st derivative still only builds a FLAT tangent approximation; UKF captures 2nd/3rd-order Taylor terms of the posterior mean & covariance, beating EKF on strong nonlinearities!',
          },
        ],
        lockedLabel: 'EKF vs. UKF / SR-UKF',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{UKF/SR-UKF: } 2n+1\\text{ pts, 2nd/3rd-order accuracy, zero Jacobians, PSD } \\sqrt{P}}',
        hint: 'Remember UKF uses $2n+1$ sigma points (still unimodal Gaussian) and SR-UKF maintains the square-root Cholesky factor directly.',
      },
    ],
  },

  // =========================================================================
  // TIER 5: SOTA ESTIMATION — FACTOR GRAPHS, MHE & INVARIANT EKF (2 problems)
  // =========================================================================
  {
    id: 'ss5-factor-graph-mhe',
    tier: 'sota-estimation',
    tierLabel: 'SOTA: InEKF & MHE',
    title: 'Modern SOTA: Factor Graphs (GTSAM/iSAM2) & Moving Horizon Estimation (MHE)',
    mechatronicsContext:
      'Classical EKF/UKF permanently marginalize away every past state at the wrong linearization point and collapse under a single GPS multipath spike. Modern autonomous cars, drones, and SLAM pipelines (GTSAM, iSAM2, Ceres) solve sparse Factor Graph MAP optimization — and constrained Moving Horizon Estimation (MHE) is the exact estimation dual of MPC!',
    expressionLatex:
      'x_0\\approx 0,\\; x_1-x_0\\approx 2,\\; x_1\\approx 3\\;(\\sigma=1)',
    finalAnswerLatex:
      '\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}\\begin{bmatrix}x_0\\\\x_1\\end{bmatrix}=\\begin{bmatrix}-2\\\\5\\end{bmatrix} \\implies \\hat{x}_0=\\frac{1}{3},\\; \\hat{x}_1=\\frac{8}{3} \\;(\\text{Full MAP Smoothing})',
    diagram: {
      type: 'estimator-arch',
      variant: 'factor-graph',
      model: 'f_odom(x₀,x₁)',
      meas: 'f₀(x₀), f₁(x₁)',
      noise: 'JᵀJx=Jᵀb · Huber',
      highlight: 'MAP / MHE Window',
      subtitle: 'Factor Graph MAP & MHE Smoother',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 5.0],
      setpoint: 0.0,
      setpointLabel: 'Zero Trajectory Error (Ground Truth)',
      primaryLabel: 'Factor Graph / MHE Smoother (Huber)',
      baselineLabel: 'Recursive EKF (Frozen Linearization Drift)',
      primaryFn: (t) => 0.85 * Math.exp(-1.15 * t) + 0.04 * Math.exp(-0.5 * t) * Math.sin(3 * t),
      baselineFn: (t) =>
        0.85 * Math.exp(-0.45 * t) + 0.28 * (1 - Math.exp(-0.8 * t)) + 0.14 * Math.exp(-Math.pow(t - 2.4, 2) / 0.18),
      defaultCursor: 0.48,
      subtitle:
        'Hover across time $t$: Factor Graph / MHE smoothing (Emerald) retroactively re-linearizes past poses and rejects a GPS outlier spike at $t=2.4\\text{ s}$ via Huber M-estimation, whereas a recursive EKF (Cyan dashed) accumulates frozen linearization bias and outlier kick!',
      domainMeta: 'MAP Trajectory Smoothing · Sparse Cholesky (iSAM2) & MHE',
      metrics: [
        { label: 'Normal Eqns', value: '[[2,−1],[−1,2]]x̂=[−2,5]ᵀ' },
        { label: 'Smoothed x̂₀', value: '1/3 (Updated via z₁!)' },
        { label: 'Smoothed x̂₁', value: '8/3 ≈ 2.667' },
        { label: 'Outlier Shield', value: 'Huber/Cauchy + MHE ✓' },
      ],
    },
    steps: [
      {
        stepType: 'map_nls_formulation',
        badge: 'Formulate Bayesian MAP as Nonlinear Least-Squares',
        whyThisStep:
          'Rather than compressing all history into a single fragile Gaussian $(\\hat{x}_k, P_k)$ like an EKF, modern SLAM and MHE maximize the full joint posterior $p(x_{0:N} \\mid z_{0:N}, u_{0:N-1})$ over a window of poses.',
        systemImpact:
          'Taking $-\\ln p(x_{0:N} \\mid z)$ converts independent Gaussian likelihoods directly into a **weighted nonlinear least-squares** sum $\\min_{x_{0:N}} \\sum_i \\|r_i(x)\\|_{\\Sigma_i^{-1}}^2$ — unifying probabilistic robotics with sparse numerical optimization!',
        prompt:
          'How does modern Maximum A Posteriori (MAP) trajectory estimation over states $x_{0:N}$ reformulate Bayesian sensor fusion compared to recursive EKF marginalization?',
        highlightLatex:
          '\\hat{x}_{0:N}^{\\text{MAP}} = \\arg\\max_{x_{0:N}} \\prod_i \\exp\\!\\left(-\\tfrac{1}{2}\\|r_i(x)\\|_{\\Sigma_i^{-1}}^2\\right) \\iff \\arg\\min_{x_{0:N}} \\textcolor{#34D399}{\\sum_i \\|r_i(x)\\|_{\\Sigma_i^{-1}}^2}',
        options: [
          {
            id: 'a',
            latex: '\\text{It minimizes the sum of Mahalanobis-weighted squared factor residuals } \\sum_i \\|r_i(x)\\|_{\\Sigma_i^{-1}}^2 \\text{ jointly over the trajectory } x_{0:N}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{It discards all past states } x_0, \\dots, x_{N-1} \\text{ at each step to maintain a single scalar variance}',
            correct: false,
            misconception:
              'Throwing away past states at every step is recursive EKF filtering — Factor Graphs & MHE intentionally KEEP trajectory states in the window so new sensors can retroactively improve past estimates!',
          },
          {
            id: 'c',
            latex: '\\text{It maximizes the sum of squared residuals } \\sum_i \\|r_i(x)\\|^2 \\text{ without covariance weighting}',
            correct: false,
            misconception:
              'Because $-\\ln(\\exp(-\\frac{1}{2} r^T \\Sigma^{-1} r)) = +\\frac{1}{2}\\|r\\|_{\\Sigma^{-1}}^2$, MAP MINIMIZES the negative log-posterior, weighted inversely by each sensor’s covariance $\\Sigma_i^{-1}$!',
          },
          {
            id: 'd',
            latex: '\\text{It replaces all sensor measurements with dead-reckoning odometry alone}',
            correct: false,
            misconception:
              'MAP fuses priors, odometry, IMU preintegration, cameras, LiDAR, and GPS seamlessly as additive residual terms in one unified objective!',
          },
        ],
        lockedLabel: 'MAP Least-Squares',
        lockedResultLatex: '\\hat{x}_{0:N}^{\\text{MAP}} = \\textcolor{#34D399}{\\arg\\min_{x_{0:N}} \\sum_i \\|r_i(x)\\|_{\\Sigma_i^{-1}}^2}',
        hint: 'Take the negative logarithm of a product of Gaussian densities $\\prod_i \\exp(-\\frac{1}{2} r_i^T \\Sigma_i^{-1} r_i)$.',
      },
      {
        stepType: 'factor_graph_topology',
        badge: 'Map the Bipartite Factor Graph (Nodes & Factors)',
        whyThisStep:
          'Factor graphs turn dense-looking multi-sensor equations into a sparse bipartite diagram of **variable nodes** (unknown robot states) and **factor nodes** (probabilistic constraints), exposing the exact sparsity pattern of $J^T J$!',
        systemImpact:
          'Connecting variables $\\{x_0, x_1\\}$ via two unary factors ($f_0(x_0)$ prior, $f_2(x_1)$ GPS) and one binary odometry factor ($f_1(x_0, x_1)$) shows directly why off-diagonal $(0,1)$ fill-in appears ONLY where a factor links two states!',
        prompt:
          'Map our 2-pose problem (prior $x_0 \\approx 0$, odometry $x_1 - x_0 \\approx 2$, GPS measurement $x_1 \\approx 3$) onto its bipartite Factor Graph structure.',
        highlightLatex:
          'r_0 = \\textcolor{#22D3EE}{x_0} - 0, \\qquad r_1 = \\textcolor{#22D3EE}{x_1 - x_0} - 2, \\qquad r_2 = \\textcolor{#22D3EE}{x_1} - 3',
        options: [
          {
            id: 'a',
            latex: '\\text{3 variable nodes } (r_0, r_1, r_2) \\text{ connected by 2 factor nodes } (x_0, x_1)',
            correct: false,
            misconception:
              'Inverted! Unknown poses $(x_0, x_1)$ are the **variable nodes** (circles), while measurement/motion residuals $(f_0, f_1, f_2)$ are the **factor nodes** (squares).',
          },
          {
            id: 'b',
            latex: '\\text{Variable nodes } \\{x_0, x_1\\} \\text{ linked to 2 unary factors } f_0(x_0),\\; f_2(x_1) \\text{ and 1 binary odometry factor } f_1(x_0, x_1)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{A fully connected dense graph where every factor depends on every past and future pose}',
            correct: false,
            misconception:
              'Factor graphs are ultra-SPARSE! Each unary measurement touches 1 pose, and each odometry factor touches only 2 adjacent poses — making 10,000-pose SLAM tractable in milliseconds!',
          },
          {
            id: 'd',
            latex: '\\text{Variable nodes } \\{x_0, x_1\\} \\text{ connected by 3 unary factors (odometry is unary)}',
            correct: false,
            misconception:
              'Relative odometry $x_1 - x_0 \\approx 2$ constrains the DIFFERENCE between two poses, making it a **binary** factor connecting both $x_0$ and $x_1$.',
          },
        ],
        lockedLabel: 'Factor Graph Topology',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Vars } \\{x_0, x_1\\}; \\; \\text{Unary } f_0(x_0), f_2(x_1); \\; \\text{Binary } f_1(x_0, x_1)}',
        hint: 'Count how many unknown variables appear inside each residual: 1 variable $\\to$ unary factor, 2 variables $\\to$ binary factor.',
      },
      {
        stepType: 'gauss_newton_solve',
        badge: 'Solve Gauss-Newton Normal Equations (JᵀJ)x̂ = Jᵀb',
        whyThisStep:
          'Every iteration of GTSAM, Ceres, or g2o assembles the stacked residual Jacobian $J$ and solves the sparse symmetric positive-definite linear system $(J^T J)\\,\\Delta\\mathbf{x} = J^T \\mathbf{b}$ via Cholesky factorization.',
        systemImpact:
          'Solving $\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}\\hat{\\mathbf{x}} = \\begin{bmatrix}-2\\\\5\\end{bmatrix}$ yields $\\hat{x}_0 = \\frac{1}{3},\\; \\hat{x}_1 = \\frac{8}{3}$ — notice how future GPS $z_1 = 3$ **retroactively pulled past pose $\\hat{x}_0$ from $0$ up to $\\frac{1}{3}$** (backward smoothing!)',
        prompt:
          'With stacked residual $J\\mathbf{x} - \\mathbf{b} = \\begin{bmatrix}1&0\\\\-1&1\\\\0&1\\end{bmatrix}\\begin{bmatrix}x_0\\\\x_1\\end{bmatrix} - \\begin{bmatrix}0\\\\2\\\\3\\end{bmatrix}$ ($\\Sigma = I$), assemble $(J^T J)\\hat{\\mathbf{x}} = J^T\\mathbf{b}$ and solve for $(\\hat{x}_0, \\hat{x}_1)$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{J^T J} = \\begin{bmatrix}1&-1&0\\\\0&1&1\\end{bmatrix}\\begin{bmatrix}1&0\\\\-1&1\\\\0&1\\end{bmatrix}, \\qquad \\textcolor{#F59E0B}{J^T \\mathbf{b}} = \\begin{bmatrix}1&-1&0\\\\0&1&1\\end{bmatrix}\\begin{bmatrix}0\\\\2\\\\3\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}\\hat{\\mathbf{x}} = \\begin{bmatrix}2\\\\5\\end{bmatrix} \\implies \\hat{x}_0 = 3,\\; \\hat{x}_1 = 4',
            correct: false,
            misconception:
              'Watch the minus sign in row 1 of $J^T \\mathbf{b}$: $(1)(0) + (-1)(2) + (0)(3) = -2$, NOT $+2$!',
          },
          {
            id: 'b',
            latex: '\\hat{x}_0 = 0, \\quad \\hat{x}_1 = 2.5 \\;(\\text{past state } x_0 \\text{ cannot change})',
            correct: false,
            misconception:
              'That is a forward-only Kalman Filter leaving $\\hat{x}_0 = 0$ frozen! In a Factor Graph smoother, the off-diagonal $-1$ in $J^T J$ couples $x_0$ and $x_1$ so $z_1 = 3$ updates BOTH $\\hat{x}_0 = 1/3$ and $\\hat{x}_1 = 8/3$!',
          },
          {
            id: 'c',
            latex: '\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}\\hat{\\mathbf{x}} = \\begin{bmatrix}-2\\\\5\\end{bmatrix} \\implies \\hat{x}_0 = \\frac{1}{3},\\; \\hat{x}_1 = \\frac{8}{3}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}\\hat{\\mathbf{x}} = \\begin{bmatrix}-2\\\\5\\end{bmatrix} \\implies \\hat{x}_0 = -3,\\; \\hat{x}_1 = 4',
            correct: false,
            misconception:
              'Check the off-diagonal of $J^T J$: column 1 dot column 2 is $(1)(0) + (-1)(1) + (0)(1) = -1$, NOT $+1$!',
          },
        ],
        lockedLabel: 'Smoothed MAP Solution',
        lockedResultLatex: '\\hat{x}_0 = \\textcolor{#34D399}{\\frac{1}{3}}, \\quad \\hat{x}_1 = \\textcolor{#34D399}{\\frac{8}{3}} \\quad (\\text{backward smoothing!})',
        hint: 'Invert $\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}^{-1} = \\frac{1}{3}\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}$ and multiply by $\\begin{bmatrix}-2\\\\5\\end{bmatrix}$.',
      },
      {
        stepType: 'factor_graph_advantages',
        badge: 'Why Factor Graphs Beat EKF/UKF in Modern SLAM & VIO',
        whyThisStep:
          'Ask any autonomy lead why modern VIO/LiDAR-SLAM stacks (GTSAM, iSAM2, ORB-SLAM3, LIO-SAM) abandoned EKF-SLAM: three structural superpowers separate graph smoothers from recursive filters.',
        systemImpact:
          'Keeping sparse trajectory variables unlocks **full re-linearization** of past poses upon loop closure, **incremental sparse Cholesky / Bayes-tree (iSAM2)** speed, and **robust M-estimators (Huber/Cauchy)** that shrug off GPS/LiDAR outliers!',
        prompt:
          'What three structural advantages allow **Factor Graphs (GTSAM / iSAM2)** to dominate EKF/UKF in modern SLAM, VIO, and multi-sensor robotics?',
        highlightLatex:
          '\\min_{\\mathbf{x}} \\sum_i \\textcolor{#F59E0B}{\\rho_{\\text{Huber}}}\\!\\left(\\|r_i(\\mathbf{x})\\|_{\\Sigma_i^{-1}}^2\\right) \\;\\xrightarrow{\\text{Sparse } R^T R = J^T J}\\; \\text{iSAM2 Bayes Tree}',
        options: [
          {
            id: 'a',
            latex: '\\text{Full re-linearization of past poses (eliminating EKF linearization lock-in), sparse incremental Cholesky/iSAM2 speed, and Huber/Cauchy robust kernels rejecting outliers}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{They require zero sensor models and automatically invent missing IMU calibrations from scratch}',
            correct: false,
            misconception:
              'Factor graphs still rely on accurate physical measurement/IMU-preintegration factor models (though they CAN cleanly include IMU biases as extra variable nodes!).',
          },
          {
            id: 'c',
            latex: '\\text{They avoid all linear algebra by using dense } O(N^3) \\text{ brute-force matrix inversion}',
            correct: false,
            misconception:
              'Dense $O(N^3)$ inversion would choke on 1,000 poses! Factor graphs exploit the extreme sparsity of $J^T J$ via sparse QR/Cholesky and incremental Bayes trees (iSAM2).',
          },
          {
            id: 'd',
            latex: '\\text{They assume every measurement has zero noise so residuals equal zero identically}',
            correct: false,
            misconception:
              'Noisy, conflicting sensors are the entire point — information matrices $\\Sigma_i^{-1}$ weight every factor probabilistically, and Huber/Cauchy loss downweights gross outliers!',
          },
        ],
        lockedLabel: 'Why Factor Graphs Win',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Re-linearization + Sparse iSAM2 Cholesky + Huber/Cauchy outlier rejection}}',
        hint: 'Focus on past-pose re-linearization, sparse graph linear algebra, and robust outlier loss functions.',
      },
      {
        stepType: 'mhe_dual_mpc',
        badge: 'Moving Horizon Estimation (MHE): The Exact Dual of MPC',
        whyThisStep:
          'What if a chemical reactor concentration, battery SoC, or tire slip ratio MUST satisfy physical inequalities ($x \\ge 0,\\; 0 \\le \\text{SoC} \\le 1$) while tracking nonlinear dynamics over a bounded CPU budget?',
        systemImpact:
          '**Moving Horizon Estimation (MHE)** solves a sliding-window constrained MAP optimization over the last $N$ samples (plus an arrival cost summarizing older history), making MHE the exact estimation twin of receding-horizon MPC!',
        prompt:
          'How does **Moving Horizon Estimation (MHE)** relate mathematically to **Model Predictive Control (MPC)**, and what capability does MHE add over unconstrained Kalman Filters?',
        highlightLatex:
          '\\text{MPC: } \\min_{\\mathbf{u}_{k:k+N-1}} J_{\\text{future}} \\;\\text{ s.t. constraints} \\quad \\Longleftrightarrow \\quad \\text{MHE: } \\min_{\\mathbf{x}_{k-N:k}} \\big(\\text{Arrival Cost} + \\sum_{j=k-N}^k \\text{residuals}\\big) \\;\\text{ s.t. } \\textcolor{#34D399}{\\mathbf{x} \\in \\mathcal{X}}',
        options: [
          {
            id: 'a',
            latex: '\\text{MHE is a forward controller that predicts future controls } u_{k:k+N} \\text{ while ignoring past measurements}',
            correct: false,
            misconception:
              'You just described MPC! MHE looks BACKWARD over the sliding window $k-N \\dots k$ of past measurements to estimate the current state $\\hat{\\mathbf{x}}_k$.',
          },
          {
            id: 'b',
            latex: '\\text{MHE is the exact mathematical dual of MPC: it solves a bounded-window nonlinear constrained optimization backward in time, natively enforcing physical bounds like } x \\ge 0',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{MHE keeps every measurement since } t = 0 \\text{ forever, so its compute cost grows unboundedly with time}',
            correct: false,
            misconception:
              'The "Moving Horizon" keeps a FIXED window of the last $N$ steps (bounding runtime!) and folds older measurements into a compact **arrival cost** prior on $x_{k-N}$.',
          },
          {
            id: 'd',
            latex: '\\text{MHE cannot handle nonlinear dynamics or constraints and reduces strictly to a fixed-gain Luenberger observer}',
            correct: false,
            misconception:
              'MHE’s entire superpower is handling BOTH strong nonlinearities AND hard physical state/disturbance constraints ($x_{\\min} \\le x \\le x_{\\max}$) cleanly inside an online NLP/QP!',
          },
        ],
        lockedLabel: 'MHE ↔ MPC Duality',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{MHE: backward sliding-window constrained MAP (exact estimation dual of MPC)}}',
        hint: 'Compare MPC (future horizon, control constraints) with MHE (past sliding window, arrival cost + physical state bounds).',
      },
    ],
  },

  {
    id: 'ss5-inekf-lie-groups',
    tier: 'sota-estimation',
    tierLabel: 'SOTA: InEKF & MHE',
    title: 'Modern SOTA Legged/Drone Estimation: Invariant EKF (InEKF) on Lie Groups',
    mechatronicsContext:
      'State-of-the-art quadrupeds (Spot, ANYmal, Cassie), humanoids, and high-speed drones run an Invariant Extended Kalman Filter (InEKF) on the matrix Lie group SE₂(3) instead of naive Euler/Quaternion EKFs. Exploiting geometric symmetry eliminates state-dependent Jacobian corruption and guarantees convergence even from huge initial heading errors!',
    expressionLatex:
      'X\\in SE_2(3),\\; \\eta=\\hat{X}^{-1}X=\\exp(\\xi^\\wedge)',
    finalAnswerLatex:
      'X = \\begin{bmatrix}R&\\mathbf{v}&\\mathbf{p}\\\\0&1&0\\\\0&0&1\\end{bmatrix}\\in SE_2(3), \\quad \\eta=\\hat{X}^{-1}X, \\quad \\dot{\\xi}=A_t\\xi \\;(\\text{Log-Linear Autonomous Error ✓})',
    diagram: {
      type: 'estimator-arch',
      variant: 'inekf',
      model: 'X ∈ SE₂(3) IMU',
      meas: 'Foot Contact / GNSS',
      noise: 'η=exp(ξ^), ξ̇=A_t ξ',
      highlight: 'State-Indep. A_t',
      subtitle: 'Invariant EKF on Matrix Lie Group',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 4.0],
      setpoint: 0.0,
      setpointLabel: 'Zero Yaw Error (0 rad)',
      primaryLabel: 'Invariant EKF (SE₂(3) Log-Linear)',
      baselineLabel: 'Standard Euler/Quat EKF (90° Init Error)',
      primaryFn: (t) => 1.57 * Math.exp(-1.8 * t),
      baselineFn: (t) =>
        1.57 * Math.exp(-0.35 * t) * Math.cos(1.35 * t) + 0.34 * (1 - Math.exp(-0.9 * t)),
      defaultCursor: 0.4,
      subtitle:
        'Hover across time $t$ from a massive $90^\\circ$ ($1.57\\text{ rad}$) initial heading error: InEKF (Emerald) obeys exact state-independent log-linear error decay $\\dot{\\xi} = A_t\\xi$ straight to zero, whereas standard EKF (Cyan dashed) linearizes around the wrong heading $\\hat{\\theta}$, injecting false yaw observability and slow biased oscillation!',
      domainMeta: 'Lie Group Convergence · InEKF vs Standard EKF · 90° Init Error',
      metrics: [
        { label: 'State Manifold', value: 'X ∈ SE₂(3) (RᵀR=I)' },
        { label: 'Group Error', value: 'η = X̂⁻¹X = exp(ξ^)' },
        { label: 'Error ODE', value: 'ξ̇ = A_t ξ (No X̂!)' },
        { label: 'Legged/IMU SOTA', value: 'InEKF (Barrau 2017) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'std_ekf_yaw_bug',
        badge: 'Diagnose Why Standard EKF Diverges on Heading Errors',
        whyThisStep:
          'Before embracing matrix Lie groups, every engineer should know the exact mathematical bug that breaks classical Euler-angle and quaternion EKFs on real mobile robots and quadrupeds.',
        systemImpact:
          'In a standard EKF, the linearized Jacobian $F_t(\\hat{\\mathbf{x}})$ depends explicitly on the *erroneous* estimated heading $\\hat{\\theta}$, creating spurious observability along unobservable yaw directions and collapsing covariance into overconfident divergence!',
        prompt:
          'Why do classical Euler-angle or additive-state EKFs frequently lose consistency or diverge when a robot starts with a large heading/yaw error?',
        highlightLatex:
          '\\text{Standard EKF: } \\dot{\\mathbf{e}} \\approx \\textcolor{#F59E0B}{F_t(\\hat{\\mathbf{x}})}\\,\\mathbf{e} \\quad (\\text{evaluated at WRONG } \\hat{\\theta}!)',
        options: [
          {
            id: 'a',
            latex: '\\text{Their linearized Jacobians } F_t(\\hat{\\mathbf{x}}), H_t(\\hat{\\mathbf{x}}) \\text{ depend explicitly on the wrong estimated heading } \\hat{\\theta}, \\text{ injecting bogus covariance \\& false yaw observability}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{Standard EKF cannot process gyroscope angular velocity measurements } \\omega_k',
            correct: false,
            misconception:
              'Standard EKFs process IMU gyroscopes all the time — the failure is geometric: evaluating tangent Jacobians at a wrong $\\hat{\\theta}$ breaks the true unobservable yaw symmetry of the physics!',
          },
          {
            id: 'c',
            latex: '\\text{Standard EKF requires solving a convex Quadratic Program at every IMU tick}',
            correct: false,
            misconception:
              'Standard EKF is purely closed-form matrix algebra (no QP); its weakness is state-dependent linearization inconsistency, not QP runtime.',
          },
          {
            id: 'd',
            latex: '\\text{Yaw is always observable from accelerometer gravity alone, so EKF should never diverge}',
            correct: false,
            misconception:
              'Gravity points strictly along $-\\hat{z}$ (vertical): it observes roll and pitch, NEVER yaw rotation around gravity! When standard EKF pretends yaw is observable, it shrinks yaw variance spuriously and diverges!',
          },
        ],
        lockedLabel: 'Standard EKF Flaw',
        lockedResultLatex: '\\textcolor{#F59E0B}{F_t(\\hat{\\mathbf{x}}) \\text{ depends on wrong } \\hat{\\theta}} \\implies \\text{inconsistent covariance \\& divergence}',
        hint: 'Notice what happens to the Jacobian $\\left.\\frac{\\partial f}{\\partial x}\\right|_{\\hat{x}}$ when the linearization point $\\hat{\\theta}$ is $60^\\circ$ off from true $\\theta$.',
      },
      {
        stepType: 'lie_group_embedding',
        badge: 'Embed Pose & Velocity on Matrix Lie Group SE₂(3)',
        whyThisStep:
          '3D rotations do NOT live in flat Euclidean space $\\mathbb{R}^3$ — they live on the curved smooth manifold $SO(3)$ ($R^T R = I,\\; \\det R = +1$). Packing $(R, \\mathbf{v}, \\mathbf{p})$ into one extended pose matrix preserves exact geometry natively!',
        systemImpact:
          'Representing the full inertial navigation state as $X = \\begin{bmatrix}R & \\mathbf{v} & \\mathbf{p} \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix} \\in SE_2(3)$ guarantees exact orthogonality $R^T R = I$ globally with ZERO gimbal lock and zero ad-hoc quaternion renormalization!',
        prompt:
          'How does the **Invariant EKF** embed 3D orientation $R \\in SO(3)$, velocity $\\mathbf{v} \\in \\mathbb{R}^3$, and position $\\mathbf{p} \\in \\mathbb{R}^3$ to eliminate Euler gimbal lock and stay strictly on the manifold?',
        highlightLatex:
          'X = \\begin{bmatrix} \\textcolor{#22D3EE}{R} & \\textcolor{#F59E0B}{\\mathbf{v}} & \\textcolor{#34D399}{\\mathbf{p}} \\\\ \\mathbf{0}^T & 1 & 0 \\\\ \\mathbf{0}^T & 0 & 1 \\end{bmatrix} \\in SE_2(3) \\subset \\mathbb{R}^{5 \\times 5}',
        options: [
          {
            id: 'a',
            latex: '\\text{Stack Euler angles, velocity, and position into a flat vector } [\\phi,\\theta,\\psi,\\mathbf{v},\\mathbf{p}]^T \\in \\mathbb{R}^9 \\text{ and add } +K\\tilde{y}',
            correct: false,
            misconception:
              'Euler angles suffer gimbal lock at $\\theta = \\pm 90^\\circ$ and flat vector addition ignores the curved non-commutative geometry of 3D rotations!',
          },
          {
            id: 'b',
            latex: '\\text{Pack } (R, \\mathbf{v}, \\mathbf{p}) \\text{ into a single } 5\\times 5 \\text{ matrix Lie group element } X \\in SE_2(3) \\text{ closed under matrix multiplication, preserving } R^T R = I \\text{ without gimbal lock}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Ignore rotation } R \\text{ completely and estimate only Cartesian position } \\mathbf{p} \\in \\mathbb{R}^3',
            correct: false,
            misconception:
              'Body-frame IMU accelerometers and leg kinematics must be rotated into the world frame via $R$ at every tick — $R, \\mathbf{v}, \\mathbf{p}$ are inextricably coupled!',
          },
          {
            id: 'd',
            latex: '\\text{Store } R \\text{ as an unconstrained } 3\\times 3 \\text{ matrix and update via } R \\leftarrow R + \\Delta R',
            correct: false,
            misconception:
              'Adding a matrix $\\Delta R$ to a rotation matrix $R$ immediately breaks orthogonality ($R^T R \\neq I$), stretching and shearing the robot’s body frame!',
          },
        ],
        lockedLabel: 'Lie Group State SE₂(3)',
        lockedResultLatex: '\\textcolor{#34D399}{X \\in SE_2(3): \\text{ exact } R^T R = I \\text{ via group multiplication, zero gimbal lock}}',
        hint: 'Check what stays closed under matrix multiplication $X_1 X_2$ and keeps $R \\in SO(3)$ exact.',
      },
      {
        stepType: 'invariant_group_error',
        badge: 'Define Invariant Group Error η = X̂⁻¹X = exp(ξ^)',
        whyThisStep:
          'You cannot subtract two matrices on a Lie group ($X - \\hat{X} \\notin SE_2(3)$)! Instead, multiplying by the group inverse defines a geometric error that stays on the manifold and maps cleanly to a flat Gaussian vector via the matrix exponential.',
        systemImpact:
          'Defining Left-Invariant error $\\eta_L = \\hat{X}^{-1} X$ (or Right-Invariant $\\eta_R = X \\hat{X}^{-1}$) and writing $\\eta = \\exp(\\xi^\\wedge)$ concentrates uncertainty as a standard Gaussian $\\xi \\sim \\mathcal{N}(0, P)$ in the flat tangent Lie algebra $\\mathfrak{se}_2(3)$!',
        prompt:
          'How do we define the estimation error between true state $X \\in SE_2(3)$ and estimate $\\hat{X} \\in SE_2(3)$, and map it to a flat tangent error vector $\\xi \\in \\mathbb{R}^9$?',
        highlightLatex:
          '\\eta = \\textcolor{#22D3EE}{\\hat{X}^{-1} X} \\;(\\text{or } X\\hat{X}^{-1}) \\in SE_2(3), \\qquad \\eta = \\exp\\!\\big(\\textcolor{#34D399}{\\xi^\\wedge}\\big), \\quad \\xi \\sim \\mathcal{N}(0, P)',
        options: [
          {
            id: 'a',
            latex: '\\text{Additive Euclidean difference } \\eta = X - \\hat{X}',
            correct: false,
            misconception:
              '$SE_2(3)$ is NOT a vector space — subtracting two group matrices produces zeros on the bottom diagonal and destroys $R^T R = I$!',
          },
          {
            id: 'b',
            latex: '\\text{Multiplicative invariant group error } \\eta = \\hat{X}^{-1}X \\text{ (left) or } X\\hat{X}^{-1} \\text{ (right), mapped via matrix exponential } \\eta = \\exp(\\xi^\\wedge) \\text{ to tangent } \\xi \\in \\mathbb{R}^9',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Elementwise division } \\eta_{ij} = X_{ij} / \\hat{X}_{ij}',
            correct: false,
            misconception:
              'Elementwise division divides by zeros in the bottom rows and violates matrix group geometry; the group inverse is $\\hat{X}^{-1}$!',
          },
          {
            id: 'd',
            latex: '\\text{Scalar determinant ratio } \\eta = \\det(X) / \\det(\\hat{X})',
            correct: false,
            misconception:
              'For EVERY element $X \\in SE_2(3)$, $\\det(X) = \\det(R) = +1$ identically, so the ratio is always $1$ and contains zero error information!',
          },
        ],
        lockedLabel: 'Invariant Group Error',
        lockedResultLatex: '\\eta = \\textcolor{#34D399}{\\hat{X}^{-1}X = \\exp(\\xi^\\wedge)}, \\qquad \\xi \\in \\mathbb{R}^9',
        hint: 'Notice that when $\\hat{X} = X$, the multiplicative error equals the group identity $\\hat{X}^{-1}X = I = \\exp(0^\\wedge)$.',
      },
      {
        stepType: 'log_linear_theorem',
        badge: 'Breakthrough: Log-Linear Autonomous Error Theorem',
        whyThisStep:
          'Why did Barrau & Bonnabel’s 2017 InEKF paper transform legged and aerial robotics overnight? Because for **group-affine** dynamics (which include exact 3D IMU + foot-contact kinematics!), something almost miraculous happens to $\\dot{\\xi}$!',
        systemImpact:
          'For group-affine dynamics, the Lie-algebra error ODE $\\dot{\\xi} = A_t \\xi$ is **EXACT and strictly independent of the estimated state $\\hat{X}$** — killing EKF’s state-dependent Jacobian feedback loop and delivering provable convergence even from $> 90^\\circ$ initial yaw errors!',
        prompt:
          'What is the core mathematical breakthrough of the **Log-Linear Autonomous Error Theorem** for InEKF on group-affine dynamics (3D IMU + legged foot contact)?',
        highlightLatex:
          '\\text{Group-Affine IMU + Contact} \\;\\implies\\; \\dot{\\xi} = \\textcolor{#34D399}{A_t\\,\\xi} \\qquad (\\text{ZERO dependence on } \\hat{X}!)',
        options: [
          {
            id: 'a',
            latex: '\\text{The tangent error dynamics } \\dot{\\xi} = A_t \\xi \\text{ are exact and strictly independent of the state estimate } \\hat{X}, \\text{ guaranteeing consistent covariance \\& convergence from huge initial errors}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{The covariance matrix } P_t \\text{ stays constant at } P_0 \\text{ forever so no Riccati propagation is required}',
            correct: false,
            misconception:
              'Covariance still propagates via $\\dot{P} = A_t P + P A_t^T + Q_t$ and updates on measurements — the miracle is that $A_t$ does NOT depend on the erroneous state estimate $\\hat{X}$!',
          },
          {
            id: 'c',
            latex: '\\text{InEKF works ONLY for 1D linear systems } \\dot{x} = ax + bu',
            correct: false,
            misconception:
              'InEKF is specifically built for NONLINEAR 3D rigid-body IMU/kinematic systems on $SE_2(3)$ — it turns nonlinear 3D navigation error into an exact linear ODE in the Lie algebra!',
          },
          {
            id: 'd',
            latex: '\\text{InEKF eliminates IMU accelerometer and gyroscope noise completely without any sensors}',
            correct: false,
            misconception:
              'Noise still enters via $\\operatorname{Ad}_{\\hat{X}} Q$; InEKF eliminates *linearization-point corruption* of the error dynamics and preserves exact physical observability (e.g., unobservable yaw stays unobservable)!',
          },
        ],
        lockedLabel: 'Log-Linear Error Theorem',
        lockedResultLatex: '\\textcolor{#34D399}{\\dot{\\xi} = A_t\\xi \\text{ strictly independent of } \\hat{X} \\implies \\text{provable large-error convergence}}',
        hint: 'Contrast standard EKF’s $\\dot{\\mathbf{e}} \\approx F_t(\\hat{\\mathbf{x}})\\mathbf{e}$ against InEKF’s exact $\\dot{\\xi} = A_t \\xi$.',
      },
      {
        stepType: 'sota_estimator_matrix',
        badge: 'Complete Modern SOTA Estimator Decision Matrix',
        whyThisStep:
          'A sharp mechatronics engineer does not use a hammer for every screw — locking in the exact architecture-to-problem decision matrix lets you pick the winning estimator on day one of any hardware project.',
        systemImpact:
          'You now hold the complete modern estimation stack: **KF (Joseph)** for linear Gaussian, **UKF/SR-UKF** for Jacobian-free smooth nonlinearities, **InEKF** for high-rate 3D IMU/legged/drone pose, **Factor Graphs (GTSAM/iSAM2) & MHE** for SLAM/outliers/constraints, and **Particle Filters** for multi-modal global localization!',
        prompt:
          'Select the exact modern SOTA estimator mapping across all five canonical robotics and mechatronics regimes.',
        highlightLatex:
          '\\text{Linear} \\to \\text{KF}, \\quad \\text{No-Jacobian} \\to \\text{UKF}, \\quad \\text{3D IMU/Legged} \\to \\textcolor{#34D399}{\\text{InEKF}}, \\quad \\text{SLAM/Bounds} \\to \\textcolor{#34D399}{\\text{GTSAM/MHE}}, \\quad \\text{Multi-Modal} \\to \\textcolor{#F59E0B}{\\text{PF}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Always use a Particle Filter for everything — 10,000 particles outperform KF, InEKF, and GTSAM at 1 kHz on every microcontroller}',
            correct: false,
            misconception:
              'Particle Filters suffer the curse of dimensionality above ~4–6 states and burn massive CPU! Reserve PFs for low-DOF multi-modal global localization (e.g., kidnapped 2D robot).',
          },
          {
            id: 'b',
            latex: '\\text{Linear}\\to\\text{KF (Joseph)};\\; \\text{Smooth NL/no-Jacobian}\\to\\text{UKF/SR-UKF};\\; \\text{IMU+Legged/Drone}\\to\\text{InEKF};\\; \\text{SLAM/Outliers/Constraints}\\to\\text{Factor Graphs/MHE};\\; \\text{Multi-modal}\\to\\text{Particle Filter}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Classical Euler EKF is strictly optimal for 3D legged IMU, loop-closure SLAM, and multi-modal kidnapped-robot localization}',
            correct: false,
            misconception:
              'Euler EKF hits gimbal lock and heading divergence on legged IMUs, locks in linearization errors on SLAM loop closures, and cannot represent multi-modal beliefs!',
          },
          {
            id: 'd',
            latex: '\\text{Luenberger observers supersede Kalman Filters, InEKF, and Factor Graphs whenever sensors have heavy Gaussian noise and outliers}',
            correct: false,
            misconception:
              'Deterministic Luenberger observers ignore noise covariances $(Q, R)$ and outliers; stochastic KF/UKF/InEKF/Factor Graphs are essential when fusing noisy heterogeneous sensors.',
          },
        ],
        lockedLabel: 'SOTA Estimator Roadmap',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{KF (Joseph) }|\\text{ SR-UKF }|\\text{ InEKF }|\\text{ GTSAM/MHE }|\\text{ Particle Filter}}',
        hint: 'Match each estimator to its exact mathematical superpower: linearity, derivative-free curvature, Lie-group symmetry, sparse smoothing/constraints, and multi-modal beliefs.',
      },
    ],
  },
];
