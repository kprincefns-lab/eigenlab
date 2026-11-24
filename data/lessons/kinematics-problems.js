/**
 * EIGENLAB — Robotics 01: Serial Robot Kinematics, Lie-Group PoE on SE(3), Jacobians & SOTA QP-IK
 * 12 deep, engineering-grade, multi-part (5–6 steps each) kinematics problems tailored for
 * Mechatronics & Robotics Engineers:
 *   Tier 1: Standard DH, Craig Modified DH (MDH) & The Parallel-Axis DH Calibration Flaw
 *   Tier 2: Modern SOTA Forward Kinematics — SO(3) Rodrigues, SE(3) Screws, Space/Body PoE & Adjoint Map
 *   Tier 3: Manipulator Jacobians, Yoshikawa Manipulability, Force Duality (τ = JᵀF) & 6D Wrist Singularities
 *   Tier 4: Closed-Form Analytical IK — 2R Workspace Annulus/Branches & 6-DOF Pieper Spherical-Wrist Decoupling
 *   Tier 5: Modern SOTA Numerical IK — Damped Least Squares (DLS), Redundant Nullspace & Differential QP-IK (Pink/Mink)
 *
 * Every step includes:
 *  - whyThisStep  : Spoiler-free engineering rationale shown while solving.
 *  - systemImpact : Physical takeaway revealed on lock-in & pinned in the ledger.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Kinematic parameters (Lᵢ, dᵢ, αᵢ) / screw axes Sᵢ / Jacobian J / pose T
 *  - Amber  (#F59E0B): Joint variables (θᵢ, q̇) / targets / weights / damping λ / constraints
 *  - Emerald(#34D399): Solved step result / verified pose / optimal joint command q̇* / torque τ
 */

export const KINEMATICS_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'dh-mdh', label: 'DH & Modified DH' },
  { id: 'poe-screw', label: 'SOTA: PoE & SE(3)' },
  { id: 'jacobians', label: 'Jacobians & Singularities' },
  { id: 'analytical-ik', label: 'Analytical IK' },
  { id: 'sota-ik', label: 'SOTA: DLS & QP-IK' },
];

export const KINEMATICS_PROBLEMS = [
  // =========================================================================
  // TIER 1: STANDARD DH, MODIFIED DH (CRAIG) & DH CALIBRATION FLAW (3 problems)
  // =========================================================================
  {
    id: 'kin1-dh-2r-planar',
    tier: 'dh-mdh',
    tierLabel: 'DH & Modified DH',
    title: 'Standard DH Table & Forward Kinematics of a 2R Planar Arm',
    mechatronicsContext:
      'Denavit-Hartenberg (DH) notation compresses every 6-DOF rigid-body link transform into just four geometric parameters (aᵢ, αᵢ, dᵢ, θᵢ). Mastering the Standard DH frame-assignment rules on a 2R arm builds the baseline benchmark against which Modified DH and modern Product of Exponentials (PoE) are judged.',
    expressionLatex:
      '2\\text{R Arm}:\\; L_1, L_2 \\;\\longrightarrow\\; \\text{DH Table},\\; T_2^0,\\; (x, y)',
    finalAnswerLatex:
      'x = L_1 c_1 + L_2 c_{12},\\; y = L_1 s_1 + L_2 s_{12};\\; (3, 2),\\; \\phi = 90^\\circ',
    diagram: {
      type: 'robot-chain',
      variant: '2r-dh',
      links: 'L₁, L₂',
      joints: 'θ₁, θ₂',
      convention: 'Standard DH',
      subtitle: '2R Planar Arm — Standard DH Frames',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.0],
      setpoint: 2.0,
      setpointLabel: 'Target y_e = 2.0 m',
      primaryLabel: 'EE y(t) = 2 sin(45°·t)',
      baselineLabel: 'EE x(t) = 3 + 2 cos(45°·t)',
      primaryFn: (t) => 2 * Math.sin((Math.PI / 4) * t),
      baselineFn: (t) => 3 + 2 * Math.cos((Math.PI / 4) * t),
      tsMarker: { t: 2.0, label: 'θ₂ = 90° → (3, 2)', band: 0.04 },
      defaultCursor: 0.72,
      subtitle:
        'Hover across time $t \\in [0, 2]\\text{ s}$ as the elbow sweeps $\\theta_2(t)$ from $0^\\circ$ to $90^\\circ$ at $45^\\circ/\\text{s}$ ($\\theta_1 = 0^\\circ,\\; L_1=3,\\; L_2=2$): $x(t)$ retracts from $5$ to $3$ (Cyan dashed) while $y(t)$ climbs smoothly to $2.0$ (Emerald).',
      domainMeta: '2R Planar FK Sweep · L₁ = 3, L₂ = 2 · θ₁ = 0°, θ₂: 0° → 90°',
      metrics: [
        { label: 'DH Row 1', value: '(L₁, 0, 0, θ₁)' },
        { label: 'DH Row 2', value: '(L₂, 0, 0, θ₂)' },
        { label: 'EE at (0°, 90°)', value: '(x, y) = (3, 2)' },
        { label: 'EE Heading φ', value: 'θ₁ + θ₂ = 90° ✓' },
      ],
    },
    steps: [
      {
        stepType: 'dh_frames',
        badge: 'Assign Standard DH Coordinate Frames',
        whyThisStep:
          'Standard DH eliminates two of the six rigid-body degrees of freedom strictly by enforcing where each frame origin and axis must sit relative to consecutive joint axes.',
        systemImpact:
          'Aligning $z_0, z_1$ with the out-of-page revolute axes and pointing $x_1$ along link 1 ($z_0 \\to z_1$) and $x_2$ along link 2 guarantees zero link twist ($\\alpha_i = 0$) and zero offset ($d_i = 0$).',
        prompt:
          'Using the Standard DH convention on the 2R planar arm (both revolute joints rotate in the $xy$-plane), how must axes $z_0, z_1$ and $x_1, x_2$ be placed?',
        highlightLatex:
          '\\text{Standard DH}:\\quad \\textcolor{#22D3EE}{z_{i-1}} \\parallel \\text{Joint } i, \\qquad \\textcolor{#F59E0B}{x_i} \\perp z_{i-1} \\text{ and } z_i',
        options: [
          {
            id: 'a',
            latex: 'z_0, z_1 \\text{ out of page } (+\\hat{z});\\; x_1 \\text{ along link 1},\\; x_2 \\text{ along link 2}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'z_0, z_1 \\text{ along link 1 and link 2};\\; x_1, x_2 \\text{ out of page } (+\\hat{z})',
            correct: false,
            misconception:
              'In DH notation, the $z$-axis is ALWAYS the joint actuation axis (rotation for revolute, slide for prismatic) — never the link spine!',
          },
          {
            id: 'c',
            latex: 'z_0 \\text{ out of page},\\; z_1 \\text{ along link 1};\\; x_1 \\perp \\text{link 1}',
            correct: false,
            misconception:
              'Both planar revolute joints spin about parallel out-of-page axes, so $z_0$ and $z_1$ must remain parallel ($\\alpha_1 = 0$).',
          },
          {
            id: 'd',
            latex: 'x_1 \\text{ attached at joint 1 pointing along } z_0;\\; x_2 \\text{ reversed toward base}',
            correct: false,
            misconception:
              'Axis $x_i$ must be mutually perpendicular to $z_{i-1}$ and $z_i$ (the common normal directed from $z_{i-1}$ toward $z_i$), never parallel to $z_0$.',
          },
        ],
        lockedLabel: 'Standard DH Frames',
        lockedResultLatex: '\\textcolor{#34D399}{z_0, z_1 \\parallel +\\hat{z},\\quad x_1 \\parallel \\text{Link }1,\\quad x_2 \\parallel \\text{Link }2}',
        hint: 'Standard DH puts $z_{i-1}$ along joint $i$ (out of the plane) and $x_i$ along the common normal from $z_{i-1}$ to $z_i$.',
      },
      {
        stepType: 'dh_table',
        badge: 'Populate the 2-Row Standard DH Table',
        whyThisStep:
          'Translating the frame geometry into the four-column table $(a_i, \\alpha_i, d_i, \\theta_i)$ provides the complete kinematic specification needed by any DH forward-kinematics engine.',
        systemImpact:
          'Because both links lie strictly in one plane with parallel $z$-axes, only the link lengths $a_1=L_1, a_2=L_2$ and joint angles $\\theta_1, \\theta_2$ are nonzero.',
        prompt:
          'Read off the two-row Standard DH parameter table $(a_i,\\; \\alpha_i,\\; d_i,\\; \\theta_i)$ for links $i=1, 2$ of the 2R planar arm.',
        highlightLatex:
          '\\text{Row } i: \\; (\\textcolor{#22D3EE}{a_i},\\; \\textcolor{#22D3EE}{\\alpha_i},\\; \\textcolor{#22D3EE}{d_i},\\; \\textcolor{#F59E0B}{\\theta_i})',
        options: [
          {
            id: 'a',
            latex: '\\text{R1: }(0, 0, L_1, \\theta_1), \\qquad \\text{R2: }(0, 0, L_2, \\theta_2)',
            correct: false,
            misconception:
              'Parameter $d_i$ measures translation along the joint axis $z_{i-1}$ (out of page), whereas link lengths $L_1, L_2$ lie along the common normals $x_1, x_2$ ($a_i$).',
          },
          {
            id: 'b',
            latex: '\\text{R1: }(L_1, 0, 0, \\theta_1), \\qquad \\text{R2: }(L_2, 0, 0, \\theta_2)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{R1: }(L_1, 90^\\circ, 0, \\theta_1), \\qquad \\text{R2: }(L_2, 90^\\circ, 0, \\theta_2)',
            correct: false,
            misconception:
              'Link twist $\\alpha_i$ is the angle between $z_{i-1}$ and $z_i$ about $x_i$; since all $z$-axes are parallel out of the page, $\\alpha_1 = \\alpha_2 = 0^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\text{R1: }(0, 0, 0, \\theta_1), \\qquad \\text{R2: }(L_1, 0, 0, \\theta_2)',
            correct: false,
            misconception:
              'Shifting $L_1$ into Row 2 and dropping $L_2$ mixes up Craig Modified DH indexing ($a_{i-1}$) with Standard DH ($a_i$).',
          },
        ],
        lockedLabel: 'Standard DH Table',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{R1: }(L_1, 0, 0, \\theta_1),\\quad \\text{R2: }(L_2, 0, 0, \\theta_2)}',
        hint: 'Check which parameter is translation along $x_i$ (link length $a_i$) versus translation along $z_{i-1}$ (joint offset $d_i$).',
      },
      {
        stepType: 'dh_matrix_order',
        badge: 'Assemble Standard DH Link Matrix Tᵢⁱ⁻¹',
        whyThisStep:
          'Rigid-body transformations in $SE(3)$ do NOT commute — multiplying the four elementary DH transforms in the wrong order produces an entirely different linkage.',
        systemImpact:
          'With $\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_x(\\alpha_i)$, the planar link matrix simplifies cleanly to $p_i^{i-1} = [a_i c_i,\\; a_i s_i,\\; 0]^T$ because the $z$-rotation acts BEFORE the $x$-translation.',
        prompt:
          'Select the exact Standard DH transformation order for $T_i^{i-1}$ and its resulting $4\\times 4$ matrix when $\\alpha_i = 0$ and $d_i = 0$.',
        highlightLatex:
          'T_i^{i-1} = \\textcolor{#F59E0B}{\\text{Z-pair}(\\theta_i, d_i)} \\cdot \\textcolor{#22D3EE}{\\text{X-pair}(a_i, \\alpha_i)}',
        options: [
          {
            id: 'a',
            latex: '\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_z(\\theta_i) \\implies p = [a_i, 0, 0]^T',
            correct: false,
            misconception:
              'Translating along $x$ BEFORE rotating around $z$ moves the link length along the previous axis $x_{i-1}$ instead of rotating link $i$ by $\\theta_i$!',
          },
          {
            id: 'b',
            latex: '\\operatorname{Rot}_x(\\alpha_i)\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)',
            correct: false,
            misconception:
              'Putting the $x$-pair $(\\alpha, a)$ on the left is Craig’s Modified DH order, not Standard DH!',
          },
          {
            id: 'c',
            latex: '\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_x(\\alpha_i) \\implies \\begin{bmatrix}c_i&-s_i&0&a_i c_i\\\\s_i&c_i&0&a_i s_i\\\\0&0&1&0\\\\0&0&0&1\\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_x(a_i) \\implies \\begin{bmatrix}c_i&s_i&0&a_i c_i\\\\-s_i&c_i&0&a_i s_i\\\\0&0&1&0\\\\0&0&0&1\\end{bmatrix}',
            correct: false,
            misconception:
              'Watch the rotation-matrix sign convention: a CCW rotation by $+\\theta_i$ about $+z$ has $-s_i$ in row 1, col 2 and $+s_i$ in row 2, col 1.',
          },
        ],
        lockedLabel: 'Standard DH Matrix',
        lockedResultLatex: 'T_i^{i-1} = \\textcolor{#34D399}{\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)\\operatorname{Trans}_x(a_i)\\operatorname{Rot}_x(\\alpha_i)}',
        hint: 'Standard DH executes the $z$-screw $(\\theta_i, d_i)$ first (on the left), followed by the $x$-screw $(a_i, \\alpha_i)$ on the right.',
      },
      {
        stepType: 'fk_chain_multiply',
        badge: 'Chain Multiply T₂⁰ = T₁⁰ T₂¹ & Simplify',
        whyThisStep:
          'Post-multiplying consecutive link transforms maps the end-effector frame all the way back to the fixed base frame `{0}`, revealing the exact closed-form kinematics.',
        systemImpact:
          'Angle-addition identities collapse the product into $c_{12} = \\cos(\\theta_1+\\theta_2)$ and $s_{12} = \\sin(\\theta_1+\\theta_2)$, proving that joint 2’s orientation is relative to link 1 so total EE heading is $\\phi = \\theta_1 + \\theta_2$.',
        prompt:
          'Multiply $T_2^0 = T_1^0 T_2^1$ and simplify using $c_1 c_2 - s_1 s_2 = c_{12}$ and $s_1 c_2 + c_1 s_2 = s_{12}$ to obtain end-effector pose $(x, y, \\phi)$.',
        highlightLatex:
          'T_2^0 = \\textcolor{#22D3EE}{T_1^0(\\theta_1)} \\cdot \\textcolor{#F59E0B}{T_2^1(\\theta_2)} = \\begin{bmatrix} R_2^0 & p_2^0 \\\\ 0^T & 1 \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'x = L_1 c_1 + L_2 c_2, \\quad y = L_1 s_1 + L_2 s_2, \\quad \\phi = \\theta_2',
            correct: false,
            misconception:
              'Angle $\\theta_2$ is measured RELATIVE to link 1, not the base $x_0$-axis! Link 2 points along the cumulative angle $\\theta_1 + \\theta_2$.',
          },
          {
            id: 'b',
            latex: 'x = L_1 c_1 + L_2 c_{12}, \\quad y = L_1 s_1 + L_2 s_{12}, \\quad \\phi = \\theta_1 + \\theta_2',
            correct: true,
          },
          {
            id: 'c',
            latex: 'x = (L_1 + L_2) c_{12}, \\quad y = (L_1 + L_2) s_{12}, \\quad \\phi = \\theta_1 + \\theta_2',
            correct: false,
            misconception:
              'Link 1 only rotates by $\\theta_1$, never by $\\theta_2$! Moving joint 2 cannot swing link 1 around the base.',
          },
          {
            id: 'd',
            latex: 'x = L_1 c_1 - L_2 s_{12}, \\quad y = L_1 s_1 + L_2 c_{12}, \\quad \\phi = \\theta_1 + \\theta_2',
            correct: false,
            misconception:
              'You applied $R_1^0$ to $[0, L_2]^T$ instead of $[L_2 c_2, L_2 s_2]^T$; check the top-right position column of $T_2^1$.',
          },
        ],
        lockedLabel: '2R Forward Kinematics',
        lockedResultLatex: '\\textcolor{#34D399}{x = L_1 c_1 + L_2 c_{12},\\quad y = L_1 s_1 + L_2 s_{12},\\quad \\phi = \\theta_1 + \\theta_2}',
        hint: 'Expand $p_2^0 = p_1^0 + R_1^0 p_2^1$, where $R_1^0 [L_2 c_2, L_2 s_2]^T = L_2 [c_1 c_2 - s_1 s_2,\\; s_1 c_2 + c_1 s_2]^T$.',
      },
      {
        stepType: 'fk_eval',
        badge: 'Evaluate Exact EE Pose at (0°, 90°)',
        whyThisStep:
          'Plugging clean test angles into a newly derived FK formula is the fastest sanity check in robotics engineering — catching frame-flip and sign bugs before flashing firmware.',
        systemImpact:
          'At $(\\theta_1, \\theta_2) = (0^\\circ, 90^\\circ)$, link 1 extends horizontally to $(3, 0)$ and link 2 turns straight upward by $2$ units to $(3, 2)$ with tool heading $\\phi = 90^\\circ$ — confirming every DH entry.',
        prompt:
          'Evaluate the end-effector position $(x, y)$ and heading $\\phi$ for $L_1 = 3,\\; L_2 = 2$ at $\\theta_1 = 0^\\circ,\\; \\theta_2 = 90^\\circ$.',
        highlightLatex:
          'L_1=\\textcolor{#22D3EE}{3},\\; L_2=\\textcolor{#22D3EE}{2},\\quad \\theta_1=\\textcolor{#F59E0B}{0^\\circ},\\; \\theta_2=\\textcolor{#F59E0B}{90^\\circ}',
        options: [
          {
            id: 'a',
            latex: '(x, y) = (5, 0), \\quad \\phi = 90^\\circ',
            correct: false,
            misconception:
              'At $\\theta_2 = 90^\\circ$, $\\cos(90^\\circ) = 0$ and $\\sin(90^\\circ) = 1$, so link 2 contributes to $y$, not $x$.',
          },
          {
            id: 'b',
            latex: '(x, y) = (2, 3), \\quad \\phi = 90^\\circ',
            correct: false,
            misconception:
              'Check which link has length $3$ vs $2$: link 1 ($L_1 = 3$) lies along $+x$ at $\\theta_1 = 0^\\circ$, while link 2 ($L_2 = 2$) points along $+y$.',
          },
          {
            id: 'c',
            latex: '(x, y) = (3, -2), \\quad \\phi = -90^\\circ',
            correct: false,
            misconception:
              'A positive $+90^\\circ$ rotation about $+z$ (out of page) turns counter-clockwise from $+x$ to $+y$, giving $y = +2$.',
          },
          {
            id: 'd',
            latex: '(x, y) = (3, 2), \\quad \\phi = 90^\\circ',
            correct: true,
          },
        ],
        lockedLabel: 'Evaluated EE Pose',
        lockedResultLatex: '\\textcolor{#34D399}{(x, y) = (3, 2), \\quad \\phi = 90^\\circ}',
        hint: 'Substitute $c_1 = 1, s_1 = 0, c_{12} = \\cos 90^\\circ = 0, s_{12} = \\sin 90^\\circ = 1$.',
      },
    ],
  },

  {
    id: 'kin1-mdh-craig-3dof',
    tier: 'dh-mdh',
    tierLabel: 'DH & Modified DH',
    title: 'Modified DH (Craig) Table for a 3R Spatial Articulated Arm',
    mechatronicsContext:
      'Industrial cobots like the Franka Emika Panda and textbook references like Craig’s Introduction to Robotics use Modified (Proximal) DH rather than Standard DH. Mixing the two parameter tables in the same codebase is one of the most notorious sources of 90° twisted kinematic models.',
    expressionLatex:
      '3\\text{R Spatial}:\\; d_1, L_2, L_3 \\;\\longrightarrow\\; \\text{Craig MDH},\\; p_e',
    finalAnswerLatex:
      'p_e = \\begin{bmatrix} c_1(L_2 c_2 + L_3 c_{23}) \\\\ s_1(L_2 c_2 + L_3 c_{23}) \\\\ d_1 + L_2 s_2 + L_3 s_{23} \\end{bmatrix}',
    diagram: {
      type: 'robot-chain',
      variant: '3r-mdh',
      links: 'd₁, L₂, L₃',
      joints: 'θ₁, θ₂, θ₃',
      convention: 'Modified DH (Craig)',
      subtitle: '3R Spatial Arm — Craig Proximal Frames',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.0],
      setpoint: 1.5,
      setpointLabel: 'Base Height d₁ = 1.5 m',
      primaryLabel: 'Height z(t) (L₂=1, L₃=0.8)',
      baselineLabel: 'Reach r(t) = L₂c₂ + L₃c₂₃',
      primaryFn: (t) => 1.5 + Math.sin(0.5 * t) + 0.8 * Math.sin(0.9 * t),
      baselineFn: (t) => Math.cos(0.5 * t) + 0.8 * Math.cos(0.9 * t),
      defaultCursor: 0.48,
      subtitle:
        'Hover across time $t \\in [0, 3]\\text{ s}$ as shoulder $\\theta_2(t)=0.5t$ and elbow $\\theta_3(t)=0.4t$ elevate the 3R arm ($d_1=1.5, L_2=1.0, L_3=0.8$): vertical height $z(t)$ rises above $d_1$ (Emerald) while horizontal radial reach $r(t)$ trades off smoothly (Cyan dashed).',
      domainMeta: '3R Craig MDH Kinematics · Vertical z(t) vs Radial Reach r(t)',
      metrics: [
        { label: 'Frame Rule', value: 'Proximal: zᵢ on Joint i' },
        { label: 'MDH Twist', value: 'α₁ = +90° (Base→Shoulder)' },
        { label: 'Tool Offset', value: 'Fixed Tₑ³ = Trans_x(L₃)' },
        { label: 'Branching Trees', value: 'Native Support ✓' },
      ],
    },
    steps: [
      {
        stepType: 'mdh_frame_rule',
        badge: 'Identify Craig Proximal Frame Placement',
        whyThisStep:
          'Before touching a single matrix, you must know whether frame `{i}` sits on joint `i` (proximal) or joint `i+1` (distal), because that choice shifts every subscript in the table.',
        systemImpact:
          'Placing frame $\\{i\\}$ at the proximal end of link $i$ with $z_i$ strictly along joint $i$ means every joint motor and link inertia tensor references its own local frame $\\{i\\}$ directly.',
        prompt:
          'How does Craig’s Modified DH (MDH) convention differ from Standard DH when attaching frame $\\{i\\}$ to link $i$?',
        highlightLatex:
          '\\text{Standard DH: } z_{i-1} \\text{ on joint } i \\quad\\text{vs.}\\quad \\text{Craig MDH: } \\textcolor{#F59E0B}{\\text{where is } \\{i\\}\\text{?}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Frame }\\{i\\}\\text{ sits at the distal end of link }i\\text{ with }z_i\\text{ along joint }i+1',
            correct: false,
            misconception:
              'That is Standard (Distal) DH! Craig’s Modified DH moves frame $\\{i\\}$ back to the proximal joint $i$.',
          },
          {
            id: 'b',
            latex: '\\text{Frame }\\{i\\}\\text{ sits at the proximal end of link }i\\text{ with }z_i\\text{ aligned with joint }i',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Frame }\\{i\\}\\text{ aligns }x_i\\text{ with joint }i\\text{ and eliminates the }z\\text{-axis rotation}',
            correct: false,
            misconception:
              'Both Standard and Modified DH always use $z$ as the joint actuation axis ($\\theta_i$ or $d_i$); only the frame’s attachment point and transform order change.',
          },
          {
            id: 'd',
            latex: '\\text{Frame }\\{i\\}\\text{ is placed at the link center of mass instead of a joint axis}',
            correct: false,
            misconception:
              'Center-of-mass frames are used in dynamics (URDF `<inertial>`), not in Craig’s Modified DH kinematic table.',
          },
        ],
        lockedLabel: 'Craig Frame Rule',
        lockedResultLatex: '\\textcolor{#34D399}{\\{i\\} \\text{ at proximal end of link } i,\\quad z_i \\parallel \\text{Joint } i}',
        hint: 'Remember the nickname "Proximal DH": frame $\\{i\\}$ lives right on the proximal joint driving link $i$.',
      },
      {
        stepType: 'mdh_matrix_order',
        badge: 'Select Exact Craig MDH Transform Order',
        whyThisStep:
          'Because frame `{i}` now sits on joint `i`, the fixed geometry of link `i-1` (`α_{i-1}, a_{i-1}`) must be traversed BEFORE executing joint `i`’s motion (`θ_i, d_i`).',
        systemImpact:
          'The X-first, Z-second factorization $\\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)$ places the pure joint variable $(\\theta_i, d_i)$ cleanly on the right-hand side of $T_i^{i-1}$.',
        prompt:
          'Choose the exact elementary transform order defining Craig’s Modified DH matrix $T_i^{i-1}$ using parameters $(\\alpha_{i-1},\\; a_{i-1},\\; d_i,\\; \\theta_i)$.',
        highlightLatex:
          'T_i^{i-1} = \\textcolor{#22D3EE}{\\text{Link }(i-1)\\text{ geometry}} \\cdot \\textcolor{#F59E0B}{\\text{Joint }i\\text{ actuation}}',
        options: [
          {
            id: 'a',
            latex: '\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_x(\\alpha_{i-1})',
            correct: false,
            misconception:
              'That Z-first, X-second sequence is Standard DH; in MDH, you first cross link $i-1$ along $x_{i-1}$ before spinning joint $i$ around $z_i$.',
          },
          {
            id: 'b',
            latex: '\\operatorname{Trans}_z(d_i)\\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_x(a_{i-1})',
            correct: false,
            misconception:
              'Interleaving $z$ and $x$ transforms breaks the two-screw factorization (link $x$-screw followed by joint $z$-screw).',
          },
          {
            id: 'c',
            latex: '\\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\operatorname{Rot}_y(\\alpha_{i-1})\\operatorname{Trans}_y(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)',
            correct: false,
            misconception:
              'DH conventions never use $y$-axis parameters — the four parameters strictly live on $x$ ($a, \\alpha$) and $z$ ($d, \\theta$).',
          },
        ],
        lockedLabel: 'MDH Transform Order',
        lockedResultLatex: 'T_i^{i-1} = \\textcolor{#34D399}{\\operatorname{Rot}_x(\\alpha_{i-1})\\operatorname{Trans}_x(a_{i-1})\\operatorname{Rot}_z(\\theta_i)\\operatorname{Trans}_z(d_i)}',
        hint: 'Follow the physical path from frame $\\{i-1\\}$ to $\\{i\\}$: twist & translate across link $i-1$ ($\\alpha_{i-1}, a_{i-1}$), then rotate & slide at joint $i$ ($\\theta_i, d_i$).',
      },
      {
        stepType: 'mdh_rows_12',
        badge: 'Populate MDH Rows 1 & 2 (90° Shoulder Twist)',
        whyThisStep:
          'The spatial 3R arm rotates vertically about the base waist ($z_1$) and pitches horizontally about the shoulder ($z_2$) — capturing that orthogonal $90^\\circ$ twist accurately in Row 2 is where most sign errors occur.',
        systemImpact:
          'Putting $\\alpha_1 = +90^\\circ$ in Row 2 rotates the vertical waist axis $z_1$ onto the horizontal shoulder axis $z_2$ (pointing along $-\\hat{y}$ at $\\theta_1=0$) so positive $\\theta_2$ lifts the arm upward in $+z$.',
        prompt:
          'For base height $d_1$ along $+z_1$ and orthogonal waist ($z_1$) to shoulder ($z_2$) axes intersecting at $(0, 0, d_1)$, select Rows 1 and 2 of the Craig MDH table $(i,\\; \\alpha_{i-1},\\; a_{i-1},\\; d_i,\\; \\theta_i)$.',
        highlightLatex:
          '\\text{MDH Columns}:\\quad (i,\\; \\textcolor{#22D3EE}{\\alpha_{i-1}},\\; \\textcolor{#22D3EE}{a_{i-1}},\\; \\textcolor{#22D3EE}{d_i},\\; \\textcolor{#F59E0B}{\\theta_i})',
        options: [
          {
            id: 'a',
            latex: '\\text{R1: }(0, 0, d_1, \\theta_1), \\qquad \\text{R2: }(+90^\\circ, 0, 0, \\theta_2)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{R1: }(+90^\\circ, 0, d_1, \\theta_1), \\qquad \\text{R2: }(0, 0, 0, \\theta_2)',
            correct: false,
            misconception:
              'In Craig MDH, $\\alpha_0$ is the twist between fixed base $z_0$ and waist $z_1$ ($0^\\circ$), while the $90^\\circ$ twist between $z_1$ and $z_2$ belongs to $\\alpha_1$ in Row 2!',
          },
          {
            id: 'c',
            latex: '\\text{R1: }(0, d_1, 0, \\theta_1), \\qquad \\text{R2: }(+90^\\circ, L_2, 0, \\theta_2)',
            correct: false,
            misconception:
              'Two traps: $d_1$ is a $z$-height (not $a_0$), and link length $L_2$ separates joint 2 from joint 3, so $L_2$ belongs to $a_2$ in Row 3!',
          },
          {
            id: 'd',
            latex: '\\text{R1: }(0, 0, 0, \\theta_1), \\qquad \\text{R2: }(0, 0, d_1, \\theta_2)',
            correct: false,
            misconception:
              'Missing $\\alpha_1 = +90^\\circ$ keeps $z_2 \\parallel z_1$ (a planar arm), and putting $d_1$ in Row 2 offsets along the horizontal shoulder axis instead of vertical base height.',
          },
        ],
        lockedLabel: 'MDH Rows 1 & 2',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{R1: }(0, 0, d_1, \\theta_1),\\quad \\text{R2: }(+90^\\circ, 0, 0, \\theta_2)}',
        hint: 'Row 1 aligns $z_1$ with $z_0$ at height $d_1$; Row 2 carries the twist $\\alpha_1 = +90^\\circ$ from $z_1$ to $z_2$ with zero common-normal length $a_1 = 0$.',
      },
      {
        stepType: 'mdh_row3_tool',
        badge: 'Populate MDH Row 3 & Distal Tool Transform',
        whyThisStep:
          'Because Craig MDH attaches frame `{3}` to the proximal elbow joint rather than the gripper tip, you must explicitly account for the final forearm link length $L_3$ with a fixed tool offset.',
        systemImpact:
          'Row 3 carries upper-arm length $a_2 = L_2$ with parallel elbow axis ($\\alpha_2 = 0$), and the fixed tool transform $T_e^3 = \\operatorname{Trans}_x(L_3)$ extends frame $\\{3\\}$ cleanly out to the end-effector tip.',
        prompt:
          'Select Row 3 $(\\alpha_2,\\; a_2,\\; d_3,\\; \\theta_3)$ for the parallel elbow joint (distance $L_2$ from shoulder) AND the fixed tool transform $T_e^3$ for forearm length $L_3$.',
        highlightLatex:
          'T_e^0 = T_1^0\\, T_2^1\\, \\textcolor{#22D3EE}{T_3^2(\\alpha_2, a_2, d_3, \\theta_3)}\\, \\textcolor{#F59E0B}{T_e^3(L_3)}',
        options: [
          {
            id: 'a',
            latex: '\\text{R3: }(0, L_3, 0, \\theta_3), \\qquad T_e^3 = I_4',
            correct: false,
            misconception:
              'In Craig MDH, $a_2$ is the distance from $z_2$ to $z_3$ (upper arm $L_2$), NOT forearm $L_3$ — skipping $T_e^3$ leaves the end-effector sitting at the elbow!',
          },
          {
            id: 'b',
            latex: '\\text{R3: }(+90^\\circ, L_2, 0, \\theta_3), \\qquad T_e^3 = \\operatorname{Trans}_z(L_3)',
            correct: false,
            misconception:
              'The elbow axis $z_3$ is parallel to the shoulder axis $z_2$ ($\\alpha_2 = 0$), and the forearm extends along $x_3$, not out sideways along $z_3$.',
          },
          {
            id: 'c',
            latex: '\\text{R3: }(0, L_2, 0, \\theta_3), \\qquad T_e^3 = \\operatorname{Trans}_x(L_3)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{R3: }(0, L_2 + L_3, 0, \\theta_3), \\qquad T_e^3 = I_4',
            correct: false,
            misconception:
              'Adding $L_2 + L_3$ into $a_2$ places the elbow joint at the end of the forearm so $\\theta_3$ would spin in place without swinging $L_3$!',
          },
        ],
        lockedLabel: 'Row 3 & Tool Offset',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{R3: }(0, L_2, 0, \\theta_3),\\quad T_e^3 = \\operatorname{Trans}_x(L_3)}',
        hint: 'Elbow axis $z_3 \\parallel z_2$ at distance $a_2 = L_2$; then translate along $x_3$ by forearm length $L_3$ to reach the tip.',
      },
      {
        stepType: 'mdh_3r_fk',
        badge: 'Derive Exact 3D End-Effector Position pₑ',
        whyThisStep:
          'Multiplying out $T_e^0 = T_1^0 T_2^1 T_3^2 T_e^3$ reveals the classic cylindrical decomposition of an articulated 3R arm: a 2R planar reach in the $(r, z)$ half-plane spun by base yaw $\\theta_1$.',
        systemImpact:
          'Factoring radial reach $r = L_2 c_2 + L_3 c_{23}$ yields $x = r c_1,\\; y = r s_1,\\; z = d_1 + L_2 s_2 + L_3 s_{23}$ — the exact regional positioning equations used in industrial 6-DOF arms.',
        prompt:
          'Multiply $T_e^0 = T_1^0 T_2^1 T_3^2 \\operatorname{Trans}_x(L_3)$ and read off the 3D end-effector position $p_e = [x,\\; y,\\; z]^T$.',
        highlightLatex:
          'r = \\textcolor{#22D3EE}{L_2 c_2 + L_3 c_{23}} \\;\\implies\\; p_e = \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'x = c_1(L_2 c_2 + L_3 c_{23}),\\; y = s_1(L_2 c_2 + L_3 c_{23}),\\; z = d_1 + L_2 s_2 + L_3 s_{23}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'x = c_1(L_2 s_2 + L_3 s_{23}),\\; y = s_1(L_2 s_2 + L_3 s_{23}),\\; z = d_1 + L_2 c_2 + L_3 c_{23}',
            correct: false,
            misconception:
              'Check $\\theta_2 = \\theta_3 = 0$: with $T_2^1 = \\operatorname{Rot}_x(90^\\circ)\\operatorname{Rot}_z(0)$, $x_2$ points horizontally along $+x_1$ (radius $L_2+L_3$), not vertically!',
          },
          {
            id: 'c',
            latex: 'x = c_1(L_2 c_2 + L_3 c_3),\\; y = s_1(L_2 c_2 + L_3 c_3),\\; z = d_1 + L_2 s_2 + L_3 s_3',
            correct: false,
            misconception:
              'Elbow angle $\\theta_3$ adds onto shoulder elevation $\\theta_2$, so the forearm elevation is $\\theta_2 + \\theta_3$ ($c_{23}, s_{23}$), not $\\theta_3$ alone.',
          },
          {
            id: 'd',
            latex: 'x = c_1(L_2 c_2 + L_3 c_{23}),\\; y = s_1(L_2 c_2 + L_3 c_{23}),\\; z = d_1 - L_2 s_2 - L_3 s_{23}',
            correct: false,
            misconception:
              'With $\\alpha_1 = +90^\\circ$, row 3 of $\\operatorname{Rot}_x(+90^\\circ)\\operatorname{Rot}_z(\\theta_2)$ is $[+s_2,\\; +c_2,\\; 0]$, so positive $\\theta_2$ lifts the arm upward ($+L_2 s_2$).',
          },
        ],
        lockedLabel: '3R Spatial Position',
        lockedResultLatex: '\\textcolor{#34D399}{p_e = [c_1(L_2 c_2 + L_3 c_{23}),\\; s_1(L_2 c_2 + L_3 c_{23}),\\; d_1 + L_2 s_2 + L_3 s_{23}]^T}',
        hint: 'At $\\theta_1=\\theta_2=\\theta_3=0$, the arm stretches horizontally to $(L_2+L_3, 0, d_1)$; pitching $\\theta_2 > 0$ raises $z$.',
      },
      {
        stepType: 'mdh_vs_sdh_architecture',
        badge: 'Why Modern Cobots & Trees Prefer MDH',
        whyThisStep:
          'Choosing a kinematic convention is an architectural decision that affects CAD export, multi-arm branching, and dynamics libraries for the lifetime of a robot platform.',
        systemImpact:
          'Because Craig MDH binds frame $\\{i\\}$ to joint $i$ itself, a torso or palm link can spawn multiple child branches cleanly without ambiguity over which child defines "joint $i+1$" — which is why Franka Panda datasheets and robotics trees favor MDH (or full URDF/PoE).',
        prompt:
          'Why do modern cobots (e.g., Franka Emika Panda) and branching kinematic trees (humanoid torsos, dexterous hands) strongly prefer Modified DH over Standard DH?',
        highlightLatex:
          '\\text{Parent Link } i \\;\\longrightarrow\\; \\{\\text{Child Joint } j,\\; \\text{Child Joint } k\\}',
        options: [
          {
            id: 'a',
            latex: '\\text{MDH requires only 2 parameters per joint instead of 4}',
            correct: false,
            misconception:
              'Both Standard DH and Craig Modified DH use exactly 4 parameters per link ($a, \\alpha, d, \\theta$).',
          },
          {
            id: 'b',
            latex: '\\text{MDH automatically eliminates all kinematic singularities in the Jacobian}',
            correct: false,
            misconception:
              'Kinematic singularities are intrinsic physical properties of the mechanism — no coordinate convention can erase a mechanical singularity.',
          },
          {
            id: 'c',
            latex: '\\text{MDH eliminates the need to multiply } 4\\times 4 \\text{ homogeneous matrices}',
            correct: false,
            misconception:
              'MDH still chains $4\\times 4$ matrices $T_i^{i-1} \\in SE(3)$; its advantage is frame attachment semantics, not fewer matrix multiplications.',
          },
          {
            id: 'd',
            latex: '\\text{Proximal }\\{i\\}\\text{ binds to joint }i\\text{, cleanly supporting branching trees \\& motor-aligned frames}',
            correct: true,
          },
        ],
        lockedLabel: 'MDH Architectural Edge',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Proximal }\\{i\\}\\text{ on joint }i \\implies \\text{clean branching trees \\& cobot specs}}',
        hint: 'Ask what happens in Standard DH if link 1 splits into two arms — which arm gets to define $z_1$?',
      },
    ],
  },

  {
    id: 'kin1-dh-scara-trap',
    tier: 'dh-mdh',
    tierLabel: 'DH & Modified DH',
    title: 'SCARA (RRP) DH Setup & The Parallel-Axis DH Calibration Flaw',
    mechatronicsContext:
      'SCARA robots dominate high-speed electronics and PCB assembly because their vertical compliance is decoupled from horizontal stiffness. Yet their parallel vertical revolute axes expose the fatal mathematical flaw of classical DH during real factory kinematic calibration.',
    expressionLatex:
      '\\text{SCARA (RRP)}:\\; (\\theta_1, \\theta_2, d_3) \\;\\longrightarrow\\; \\text{DH \\& Flaw}',
    finalAnswerLatex:
      'p_e = \\begin{bmatrix} L_1 c_1 + L_2 c_{12} \\\\ L_1 s_1 + L_2 s_{12} \\\\ d_1 - d_3 \\end{bmatrix}, \\quad \\Delta d \\sim \\frac{L}{\\sin\\epsilon} \\to \\infty',
    diagram: {
      type: 'robot-chain',
      variant: 'scara-rrp',
      links: 'L₁, L₂, d₃',
      joints: 'θ₁, θ₂, d₃',
      convention: 'RRP Prismatic',
      subtitle: '4-DOF SCARA Arm — Prismatic Quill',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0.05, 2.0],
      setpoint: 0.4,
      setpointLabel: 'Nominal Link L₁ = 0.4 m',
      primaryLabel: 'PoE / Hayati Error (Smooth)',
      baselineLabel: 'DH Offset Jump |Δd| (m, scaled ×0.01)',
      primaryFn: (t) => 0.4 + 0.012 * Math.sin(2 * t),
      baselineFn: (t) => 0.4 + Math.min(4.5, 0.22 / Math.max(0.05, t)),
      defaultCursor: 0.25,
      subtitle:
        'Hover toward $t \\to 0$ (representing a vanishing parallel-axis tilt error $\\epsilon \\to 0^\\circ$): the classical DH common-normal offset $|\\Delta d| \\propto 1/\\sin\\epsilon$ blows up toward infinity (Cyan dashed), whereas Hayati / PoE screw coordinates remain smooth and well-conditioned (Emerald).',
      domainMeta: 'Calibration Conditioning · Parallel-Axis Tilt ε → 0 · DH vs PoE',
      metrics: [
        { label: 'SCARA Type', value: 'RRP (θ₁, θ₂, d₃)' },
        { label: 'Quill Twist', value: 'α₂ = 180° (z₂ Down)' },
        { label: 'At ε = 0.1°', value: 'Δd ≈ 573·L (Blowup!)' },
        { label: 'SOTA Fix', value: 'Hayati / PoE Screws ✓' },
      ],
    },
    steps: [
      {
        stepType: 'scara_joints',
        badge: 'Identify SCARA Joint Variables (RRP)',
        whyThisStep:
          'Unlike all-revolute articulated arms, mixed revolute-prismatic robots carry the active joint variable in DIFFERENT DH columns ($\\theta_i$ for R-joints, $d_i$ for P-joints).',
        systemImpact:
          'Separating horizontal positioning ($\\theta_1, \\theta_2$) from vertical quill insertion ($d_3$) gives SCARA arms huge vertical rigidity with tiny moving inertia during PCB pick-and-place.',
        prompt:
          'For the 3-DOF positioning core of a SCARA manipulator operating over a horizontal workbench, identify the active joint variables and their motion directions.',
        highlightLatex:
          '\\text{Joint 1 (R)}: \\textcolor{#F59E0B}{\\theta_1}, \\quad \\text{Joint 2 (R)}: \\textcolor{#F59E0B}{\\theta_2}, \\quad \\text{Joint 3 (P)}: \\textcolor{#22D3EE}{d_3}',
        options: [
          {
            id: 'a',
            latex: '\\theta_1, \\theta_2 \\text{ horizontal revolute } (z\\text{-axes vertical});\\; d_3 \\text{ vertical downward prismatic quill}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\theta_1 \\text{ vertical yaw},\\; \\theta_2 \\text{ pitch in }xz\\text{-plane},\\; d_3 \\text{ radial telescope}',
            correct: false,
            misconception:
              'A yaw-pitch-telescope chain is a Spherical (Stanford) arm, not a SCARA (Selective Compliance Assembly Robot Arm)!',
          },
          {
            id: 'c',
            latex: 'd_1, d_2 \\text{ horizontal gantry slides},\\; \\theta_3 \\text{ vertical rotation}',
            correct: false,
            misconception:
              'Two orthogonal prismatic slides form a Cartesian (PPR) gantry, whereas SCARA uses two parallel revolute arms (RRP).',
          },
          {
            id: 'd',
            latex: '\\theta_1, \\theta_2, \\theta_3 \\text{ all revolute joints with parallel vertical axes}',
            correct: false,
            misconception:
              'Three parallel vertical revolute joints can only move inside a single horizontal plane and cannot dip down to pick parts!',
          },
        ],
        lockedLabel: 'SCARA RRP Core',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{R}(\\theta_1),\\; \\text{R}(\\theta_2) \\text{ parallel vertical};\\; \\text{P}(d_3) \\text{ downward quill}}',
        hint: 'SCARA = two horizontal planar swinging links plus one vertical telescoping ball-screw quill.',
      },
      {
        stepType: 'scara_dh_table',
        badge: 'Fill the RRP DH Table (α₂ = 180° Quill Flip)',
        whyThisStep:
          'Pointing the prismatic axis $z_2$ downward toward the workbench lets positive stroke $d_3 > 0$ mean "press down onto the PCB" — requiring a deliberate $180^\\circ$ link twist in Row 2.',
        systemImpact:
          'Setting $\\alpha_2 = 180^\\circ$ flips $z_2 = -z_0$ without disturbing horizontal link lengths $(L_1, L_2)$, cleanly mapping positive prismatic extension $+d_3$ to decreasing workspace height $z$.',
        prompt:
          'Select the Standard DH table $(a_i,\\; \\alpha_i,\\; d_i,\\; \\theta_i)$ for the SCARA RRP core with base height $d_1$, arm lengths $L_1, L_2$, and downward quill stroke $d_3$.',
        highlightLatex:
          'z_0, z_1 \\parallel +\\hat{z}, \\qquad z_2 \\parallel -\\hat{z} \\implies \\textcolor{#F59E0B}{\\alpha_2 = ?}',
        options: [
          {
            id: 'a',
            latex: '\\text{R1: }(L_1, 0, d_1, \\theta_1),\\; \\text{R2: }(L_2, 0, 0, \\theta_2),\\; \\text{R3: }(0, 0, d_3, 0)',
            correct: false,
            misconception:
              'With $\\alpha_2 = 0$, $z_2$ still points UPWARD ($+\\hat{z}$), so $+d_3$ would raise the quill to $d_1 + d_3$ instead of lowering it toward the table!',
          },
          {
            id: 'b',
            latex: '\\text{R1: }(L_1, 180^\\circ, d_1, \\theta_1),\\; \\text{R2: }(L_2, 180^\\circ, 0, \\theta_2),\\; \\text{R3: }(0, 0, d_3, 0)',
            correct: false,
            misconception:
              'Two $180^\\circ$ flips cancel out ($360^\\circ \\equiv 0^\\circ$), reversing $\\theta_2$’s rotation sense AND leaving $z_2$ pointing upward again!',
          },
          {
            id: 'c',
            latex: '\\text{R1: }(L_1, 0, d_1, \\theta_1),\\; \\text{R2: }(L_2, 180^\\circ, 0, \\theta_2),\\; \\text{R3: }(0, 0, d_3, 0)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{R1: }(L_1, 0, d_1, \\theta_1),\\; \\text{R2: }(L_2, 90^\\circ, 0, \\theta_2),\\; \\text{R3: }(0, 0, d_3, 0)',
            correct: false,
            misconception:
              'A $90^\\circ$ twist tilts $z_2$ horizontally, turning the vertical quill into a sideways ram!',
          },
        ],
        lockedLabel: 'SCARA RRP DH Table',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{R1: }(L_1,0,d_1,\\theta_1),\\; \\text{R2: }(L_2,180^\\circ,0,\\theta_2),\\; \\text{R3: }(0,0,d_3,0)}',
        hint: 'Keep $z_1 \\parallel z_0$ ($\\alpha_1 = 0$), flip $z_2$ opposite $z_1$ ($\\alpha_2 = 180^\\circ$), and put variable $d_3$ in Row 3 with $\\theta_3 = 0$.',
      },
      {
        stepType: 'scara_fk',
        badge: 'Compute SCARA 3D End-Effector Position',
        whyThisStep:
          'Evaluating $T_3^0 = T_1^0 T_2^1 T_3^2$ verifies that the $180^\\circ$ twist leaves horizontal planar kinematics untouched while reversing the sign on $d_3$.',
        systemImpact:
          'The decoupled coordinates $(L_1 c_1 + L_2 c_{12},\\; L_1 s_1 + L_2 s_{12},\\; d_1 - d_3)$ explain why SCARA inverse kinematics solves $z$ instantaneously ($d_3 = d_1 - z$) independently of the horizontal 2R elbow.',
        prompt:
          'Compute the SCARA tip position $p_3^0 = [x,\\; y,\\; z]^T$ from $T_3^0 = T_1^0 T_2^1 T_3^2$.',
        highlightLatex:
          'T_2^0 \\text{ has } z_2^0 = \\begin{bmatrix}0\\\\0\\\\\\textcolor{#F59E0B}{-1}\\end{bmatrix} \\;\\implies\\; p_3^0 = p_2^0 + d_3 z_2^0',
        options: [
          {
            id: 'a',
            latex: 'x = L_1 c_1 + L_2 c_{12},\\quad y = L_1 s_1 + L_2 s_{12},\\quad z = d_1 + d_3',
            correct: false,
            misconception:
              'Because $\\alpha_2 = 180^\\circ$ sets $\\cos\\alpha_2 = -1$, axis $z_2$ points along $-\\hat{z}_0$, giving $z = d_1 - d_3$.',
          },
          {
            id: 'b',
            latex: 'x = L_1 c_1 + L_2 c_{12},\\quad y = L_1 s_1 + L_2 s_{12},\\quad z = d_1 - d_3',
            correct: true,
          },
          {
            id: 'c',
            latex: 'x = L_1 c_1 - L_2 c_{12},\\quad y = L_1 s_1 - L_2 s_{12},\\quad z = d_1 - d_3',
            correct: false,
            misconception:
              'Rotating by $180^\\circ$ about $x_2$ flips $y_2$ and $z_2$, NOT $x_2$ — link 2’s length $L_2$ still adds positively along $x_2$.',
          },
          {
            id: 'd',
            latex: 'x = L_1 c_1 + L_2 c_{1-2},\\quad y = L_1 s_1 + L_2 s_{1-2},\\quad z = d_1 - d_3',
            correct: false,
            misconception:
              'The $180^\\circ$ flip occurs AFTER joint 2’s rotation $\\operatorname{Rot}_z(\\theta_2)$, so $\\theta_1$ and $\\theta_2$ still add as $\\theta_1 + \\theta_2$.',
          },
        ],
        lockedLabel: 'SCARA Position FK',
        lockedResultLatex: '\\textcolor{#34D399}{p_3^0 = [L_1 c_1 + L_2 c_{12},\\; L_1 s_1 + L_2 s_{12},\\; d_1 - d_3]^T}',
        hint: 'The horizontal $(x, y)$ matches the 2R planar arm, while $z$ starts at $d_1$ and descends by $d_3$.',
      },
      {
        stepType: 'dh_parallel_singularity',
        badge: 'Expose the Classical DH Parallel-Axis Flaw',
        whyThisStep:
          'Textbook DH works cleanly on ideal CAD models — until you try to calibrate a real machined SCARA whose shafts are off-parallel by a fraction of a degree.',
        systemImpact:
          'A tiny $\\epsilon = 0.1^\\circ$ machining tilt between nominally parallel axes $z_0$ and $z_1$ forces the unique DH common normal $x_1$ to teleport $\\Delta d \\sim L/\\sin(0.1^\\circ) \\approx 573 L$ away — making DH parameter identification catastrophically ill-conditioned!',
        prompt:
          'Suppose machining tolerances tilt SCARA axis $z_1$ by a tiny $\\epsilon = 0.1^\\circ$ relative to $z_0$ (in the plane of link 1). What catastrophic failure hits the classical 4-parameter DH representation?',
        highlightLatex:
          'z_0 \\parallel z_1 \\;\\xrightarrow{\\;\\epsilon = 0.1^\\circ\\;}\\; \\text{unique common normal } x_1 \\text{ shifts by } \\textcolor{#F59E0B}{\\Delta d \\sim \\frac{L}{\\sin\\epsilon}}',
        options: [
          {
            id: 'a',
            latex: '\\text{No issue: all four DH parameters simply perturb smoothly by } O(0.1^\\circ)',
            correct: false,
            misconception:
              'Only $\\alpha_1$ perturbs by $0.1^\\circ$ — because two nearly parallel coplanar lines intersect extremely far away, the DH origin offset $d_i$ jumps discontinuously to huge values!',
          },
          {
            id: 'b',
            latex: '\\text{The DH rotation matrix loses orthogonality so } \\det(R) \\neq 1',
            correct: false,
            misconception:
              'Every DH matrix remains a valid orthogonal transform in $SE(3)$; the failure is a parameterization discontinuity (singularity of the 4-parameter chart), not loss of orthogonality.',
          },
          {
            id: 'c',
            latex: '\\text{The link length } a_1 \\text{ collapses to } L_1\\cos(0.1^\\circ) \\text{ while } d_1 \\text{ stays fixed}',
            correct: false,
            misconception:
              'When $z_0$ and $z_1$ tilt toward each other in the plane of the link, they actually intersect at distance $L_1 / \\sin\\epsilon$ along $z$, forcing $a_1 \\to 0$ and $d_1 \\to \\pm 573 L_1$!',
          },
          {
            id: 'd',
            latex: '\\text{Common normal } x_1 \\text{ jumps wildly } (\\Delta d \\sim L/\\sin\\epsilon \\approx 573L)\\text{, breaking DH calibration}',
            correct: true,
          },
        ],
        lockedLabel: 'DH Parallel-Axis Flaw',
        lockedResultLatex: '\\textcolor{#34D399}{\\epsilon = 0.1^\\circ \\implies \\Delta d \\sim L/\\sin\\epsilon \\text{ (discontinuous DH chart!)}}',
        hint: 'Where do two lines separated by $L_1$ and tilted toward each other by $0.1^\\circ$ intersect? That intersection becomes the new DH origin!',
      },
      {
        stepType: 'sota_calibration_fix',
        badge: 'Replace DH for Modern Calibration & Robotics',
        whyThisStep:
          'Knowing WHERE classical DH breaks explains why modern robotics software (Pinocchio, MuJoCo, ROS/URDF, laser-tracker calibration) moved beyond minimal 4-parameter DH.',
        systemImpact:
          'Adding Hayati’s $\\beta_i$ ($y$-rotation) patches DH locally for parallel joints, while Product of Exponentials (PoE) on $SE(3)$ eliminates artificial common-normal frames completely with smooth, globally well-conditioned 6D screw parameters.',
        prompt:
          'How do modern factory calibration pipelines and state-of-the-art robotics libraries eliminate the DH parallel-axis singularity?',
        highlightLatex:
          '\\text{Classical DH (singular at } \\alpha=0\\text{)} \\;\\longrightarrow\\; \\textcolor{#34D399}{\\text{Smooth Calibration Model}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Use Hayati parameters } (\\text{adding } \\operatorname{Rot}_y(\\beta_i)) \\text{ or Product of Exponentials (PoE) on } SE(3)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{Switch from Standard DH to Craig Modified DH, which has no parallel-axis discontinuity}',
            correct: false,
            misconception:
              'Craig Modified DH still relies on common normals between consecutive $z$-axes and suffers the exact same parallel-axis calibration jump!',
          },
          {
            id: 'c',
            latex: '\\text{Use 64-bit floating point arithmetic so } 573L \\text{ never overflows}',
            correct: false,
            misconception:
              'Float64 prevents overflow, but the calibration Jacobian remains violently ill-conditioned and the mapping from physical errors to DH parameters stays discontinuous.',
          },
          {
            id: 'd',
            latex: '\\text{Replace revolute joints with Euler-angle ball joints in the kinematics model}',
            correct: false,
            misconception:
              'Euler angles introduce gimbal-lock singularities of their own and do not model single-axis mechanical bearings accurately.',
          },
        ],
        lockedLabel: 'Modern Calibration Fix',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Hayati } (\\beta_i) \\text{ patch or SOTA Product of Exponentials (PoE) on } SE(3)}',
        hint: 'What two formulations avoid needing a unique common normal between nearly parallel axes?',
      },
    ],
  },

  // =========================================================================
  // TIER 2: MODERN SOTA — SO(3) RODRIGUES, SE(3) SCREWS, SPACE/BODY POE & ADJOINT (3 problems)
  // =========================================================================
  {
    id: 'kin2-se3-rodrigues',
    tier: 'poe-screw',
    tierLabel: 'SOTA: PoE & SE(3)',
    title: 'Modern SOTA Foundations: SO(3), Rodrigues Exponential & Twists on SE(3)',
    mechatronicsContext:
      'Every modern robotics stack — Pinocchio, Drake, GTSAM, Modern Robotics (Lynch & Park), and humanoid whole-body controllers — replaces Euler angles and ad-hoc DH frames with Lie-group geometry: tangent-space twists in se(3) mapped smoothly onto rigid poses in SE(3) via the matrix exponential.',
    expressionLatex:
      '\\mathcal{S}=(\\omega, v)\\in\\mathfrak{se}(3) \\;\\longrightarrow\\; e^{[\\mathcal{S}]\\theta}\\in SE(3)',
    finalAnswerLatex:
      'e^{[\\omega]\\theta} = I + s_\\theta[\\omega] + (1-c_\\theta)[\\omega]^2, \\; \\mathcal{S}=(0,0,1,0,-L_1,0)^T',
    diagram: {
      type: 'screw-poe',
      variant: 'rodrigues',
      screw: 'S = (ω, v)',
      formula: 'v = −ω × q',
      map: 'se(3) → SE(3)',
      subtitle: 'Lie-Group Exponential Map on SE(3)',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.1416],
      setpoint: 0.0,
      setpointLabel: 'x-coord at θ = π/2 (x = 0)',
      primaryLabel: 'Point x(t) = L₁ + (x₀−L₁)cos(t)',
      baselineLabel: 'Point y(t) = (x₀−L₁)sin(t)',
      primaryFn: (t) => 2 - 2 * Math.cos(t),
      baselineFn: (t) => -2 * Math.sin(t),
      defaultCursor: 0.5,
      subtitle:
        'Hover across $t = \\theta \\in [0, \\pi]\\text{ s}$ (at $1\\text{ rad/s}$) tracking the origin $(0,0,0)$ rigidly swept by $e^{[\\mathcal{S}]\\theta}$ about a revolute axis at $q = [L_1, 0, 0]^T$ ($L_1 = 2$): $x(t) = 2(1-\\cos t)$ (Emerald) and $y(t) = -2\\sin t$ (Cyan dashed), confirming initial velocity $v = [0, -L_1, 0]^T$!',
      domainMeta: 'SE(3) Screw Exponential · Revolute Axis at q = (2, 0, 0) · ω = ẑ',
      metrics: [
        { label: 'Lie Algebra', value: '[ω] ∈ so(3) (Skew 3×3)' },
        { label: 'Rodrigues Map', value: 'I + sθ[ω] + (1−cθ)[ω]²' },
        { label: 'Screw Linear v', value: '−ω × q = [0, −L₁, 0]ᵀ' },
        { label: 'Gimbal Lock', value: 'Impossible on SE(3) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'skew_so3',
        badge: 'Build Skew-Symmetric Matrix [ω] ∈ so(3)',
        whyThisStep:
          'Turning a cross product $\\omega \\times p$ into matrix multiplication $[\\omega] p$ embeds 3D angular velocity directly inside the Lie algebra $\\mathfrak{so}(3)$ of $3\\times 3$ skew-symmetric matrices.',
        systemImpact:
          'Because $[\\omega]^T = -[\\omega]$, the matrix exponential $e^{[\\omega]\\theta}$ automatically satisfies $(e^{[\\omega]\\theta})^T e^{[\\omega]\\theta} = e^{-[\\omega]\\theta} e^{[\\omega]\\theta} = I$ — guaranteeing a valid rotation in $SO(3)$!',
        prompt:
          'Using the hat operator $[\\omega] \\in \\mathfrak{so}(3)$ defined by $[\\omega] p = \\omega \\times p$, construct $[\\omega]$ for the unit $z$-axis $\\omega = [0,\\; 0,\\; 1]^T$.',
        highlightLatex:
          '[\\omega] = \\begin{bmatrix} 0 & -\\omega_3 & \\omega_2 \\\\ \\omega_3 & 0 & -\\omega_1 \\\\ -\\omega_2 & \\omega_1 & 0 \\end{bmatrix}, \\qquad \\omega = \\textcolor{#22D3EE}{\\begin{bmatrix}0\\\\0\\\\1\\end{bmatrix}}',
        options: [
          {
            id: 'a',
            latex: '[\\omega] = \\begin{bmatrix} 0 & 1 & 0 \\\\ -1 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'Check the sign on $\\omega \\times \\hat{x} = \\hat{z} \\times \\hat{x} = +\\hat{y}$: multiplying by $[1,0,0]^T$ must yield $[0, +1, 0]^T$, so row 2 col 1 is $+1$ and row 1 col 2 is $-1$.',
          },
          {
            id: 'b',
            latex: '[\\omega] = \\begin{bmatrix} 0 & -1 & 0 \\\\ 1 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'c',
            latex: '[\\omega] = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & -1 \\\\ 0 & 1 & 0 \\end{bmatrix}',
            correct: false,
            misconception:
              'That skew matrix corresponds to $\\omega = [1, 0, 0]^T$ (rotation about $\\hat{x}$), not $\\omega = [0, 0, 1]^T$.',
          },
          {
            id: 'd',
            latex: '[\\omega] = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'A skew-symmetric matrix MUST have all zeros on the main diagonal ($[\\omega]^T = -[\\omega]$); a diagonal $1$ violates $\\mathfrak{so}(3)$.',
          },
        ],
        lockedLabel: 'Skew Matrix [ω]',
        lockedResultLatex: '[\\omega] = \\textcolor{#34D399}{\\begin{bmatrix} 0 & -1 & 0 \\\\ 1 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}} \\in \\mathfrak{so}(3)',
        hint: 'Plug $\\omega_1 = 0, \\omega_2 = 0, \\omega_3 = 1$ directly into the $3\\times 3$ skew-symmetric template.',
      },
      {
        stepType: 'rodrigues_formula',
        badge: 'Apply Rodrigues’ Formula on SO(3)',
        whyThisStep:
          'Integrating $\\dot{R} = [\\omega]R$ over angle $\\theta$ produces the infinite Taylor series $e^{[\\omega]\\theta} = \\sum \\frac{([\\omega]\\theta)^k}{k!}$; Rodrigues’ identity collapses that infinite series into just three closed-form terms.',
        systemImpact:
          'Because unit-axis skew matrices satisfy $[\\omega]^3 = -[\\omega]$, Rodrigues’ formula $e^{[\\omega]\\theta} = I + \\sin\\theta[\\omega] + (1-\\cos\\theta)[\\omega]^2$ computes any 3D axis-angle rotation in microseconds and recovers $R_z(\\theta)$ exactly.',
        prompt:
          'Select the exact Rodrigues exponential formula for unit axis $\\|\\omega\\|=1$ and verify its result for $\\omega = [0, 0, 1]^T$.',
        highlightLatex:
          'e^{[\\omega]\\theta} = I + \\textcolor{#F59E0B}{\\alpha(\\theta)}[\\omega] + \\textcolor{#22D3EE}{\\beta(\\theta)}[\\omega]^2, \\quad [\\omega]^2 = \\operatorname{diag}(-1,-1,0)',
        options: [
          {
            id: 'a',
            latex: 'I + \\cos\\theta[\\omega] + \\sin\\theta[\\omega]^2 \\implies R_z(\\theta)',
            correct: false,
            misconception:
              'Check $\\theta = 0$: $I + \\cos(0)[\\omega] = I + [\\omega] \\neq I$! The coefficients of $[\\omega]$ and $[\\omega]^2$ must both vanish at $\\theta = 0$.',
          },
          {
            id: 'b',
            latex: 'I + \\sin\\theta[\\omega] + (1 + \\cos\\theta)[\\omega]^2 \\implies R_z(\\theta)',
            correct: false,
            misconception:
              'At $\\theta = 0$, $1 + \\cos(0) = 2 \\neq 0$; the even Taylor series $\\frac{\\theta^2}{2!} - \\frac{\\theta^4}{4!} + \\cdots$ sums to $1 - \\cos\\theta$.',
          },
          {
            id: 'c',
            latex: 'I + \\sin\\theta[\\omega] + (1 - \\cos\\theta)[\\omega]^2 = \\begin{bmatrix}\\cos\\theta&-\\sin\\theta&0\\\\\\sin\\theta&\\cos\\theta&0\\\\0&0&1\\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'I - \\sin\\theta[\\omega] + (1 - \\cos\\theta)[\\omega]^2 = R_z(\\theta)',
            correct: false,
            misconception:
              'Negating the $\\sin\\theta[\\omega]$ term yields $R_z(-\\theta) = R_z(\\theta)^T$ (the inverse rotation)!',
          },
        ],
        lockedLabel: 'Rodrigues Formula',
        lockedResultLatex: 'e^{[\\omega]\\theta} = \\textcolor{#34D399}{I + \\sin\\theta[\\omega] + (1-\\cos\\theta)[\\omega]^2 = R_z(\\theta)}',
        hint: 'Match the leading Taylor terms: $e^{[\\omega]\\theta} = I + \\theta[\\omega] + \\frac{\\theta^2}{2}[\\omega]^2 + \\cdots$, and check $\\theta = 0$.',
      },
      {
        stepType: 'screw_axis_compute',
        badge: 'Compute 6D Unit Screw Axis S = (ω, v)',
        whyThisStep:
          'A pure revolute joint located away from the base origin induces BOTH angular velocity $\\omega$ AND linear velocity $v$ at the base origin — encoding both in one 6D screw vector $\\mathcal{S} = (\\omega, v)$ eliminates intermediate link frames.',
        systemImpact:
          'Computing $v = -\\omega \\times q = [0, -L_1, 0]^T$ encodes the exact moment of the offset joint axis: physically, spinning a rigid body CCW around $(L_1, 0, 0)$ sweeps the point passing through the origin downward in $-y$ at speed $L_1$.',
        prompt:
          'Compute the 6D unit screw axis $\\mathcal{S} = (\\omega, v) \\in \\mathbb{R}^6$ for a pure revolute joint (pitch $h = 0$) with axis $\\omega = [0, 0, 1]^T$ passing through point $q = [L_1, 0, 0]^T$.',
        highlightLatex:
          '\\mathcal{S} = \\begin{bmatrix} \\textcolor{#22D3EE}{\\omega} \\\\ \\textcolor{#F59E0B}{v} \\end{bmatrix}, \\qquad v = -\\omega \\times q, \\qquad q = \\begin{bmatrix}L_1\\\\0\\\\0\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'v = +\\omega \\times q = [0, +L_1, 0]^T \\implies \\mathcal{S} = [0,0,1,\\; 0,+L_1,0]^T',
            correct: false,
            misconception:
              'Sign trap! The linear velocity at the origin is $\\omega \\times (0 - q) = -\\omega \\times q$, NOT $+\\omega \\times q$.',
          },
          {
            id: 'b',
            latex: 'v = -\\omega \\times q = [0, -L_1, 0]^T \\implies \\mathcal{S} = [0,0,1,\\; 0,-L_1,0]^T',
            correct: true,
          },
          {
            id: 'c',
            latex: 'v = q = [L_1, 0, 0]^T \\implies \\mathcal{S} = [0,0,1,\\; L_1,0,0]^T',
            correct: false,
            misconception:
              'Never plug the position vector $q$ directly into $v$! The screw component $v$ is a linear velocity vector perpendicular to both $\\omega$ and $q$.',
          },
          {
            id: 'd',
            latex: 'v = [0, 0, 0]^T \\implies \\mathcal{S} = [0,0,1,\\; 0,0,0]^T',
            correct: false,
            misconception:
              'Only a revolute axis passing directly THROUGH the origin has $v = 0$; offsetting the axis by $L_1$ creates a nonzero velocity moment at the origin.',
          },
        ],
        lockedLabel: '6D Unit Screw Axis',
        lockedResultLatex: '\\mathcal{S} = \\textcolor{#34D399}{[0,\\; 0,\\; 1,\\; 0,\\; -L_1,\\; 0]^T}',
        hint: 'Use $\\hat{z} \\times \\hat{x} = +\\hat{y}$, then apply the minus sign in $v = -\\omega \\times q$.',
      },
      {
        stepType: 'se3_matrix_exp',
        badge: 'Assemble the 4×4 Matrix Exponential e^[S]θ ∈ SE(3)',
        whyThisStep:
          'Integrating a constant 6D screw motion combines rotation $e^{[\\omega]\\theta}$ with a coupled curved translation $G(\\theta)v$ — NOT a straight-line translation $\\theta v$!',
        systemImpact:
          'The closed-form $SE(3)$ exponential $e^{[\\mathcal{S}]\\theta} = \\begin{bmatrix}e^{[\\omega]\\theta} & G(\\theta)v \\\\ 0^T & 1\\end{bmatrix}$ with $G(\\theta) = I\\theta + (1-c_\\theta)[\\omega] + (\\theta-s_\\theta)[\\omega]^2$ keeps every point on the screw axis $q$ strictly stationary under rotation.',
        prompt:
          'Assemble the exact $4\\times 4$ matrix exponential $e^{[\\mathcal{S}]\\theta} \\in SE(3)$ for a unit screw axis $\\mathcal{S} = (\\omega, v)$ with $\\|\\omega\\| = 1$.',
        highlightLatex:
          '[\\mathcal{S}] = \\begin{bmatrix} [\\omega] & v \\\\ 0^T & 0 \\end{bmatrix} \\in \\mathfrak{se}(3) \\;\\xrightarrow{\\;\\exp(\\cdot\\,\\theta)\\;}\\; e^{[\\mathcal{S}]\\theta} \\in SE(3)',
        options: [
          {
            id: 'a',
            latex: '\\begin{bmatrix} e^{[\\omega]\\theta} & \\theta v \\\\ 0^T & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'Linear translation $\\theta v$ is only valid for a pure PRISMATIC joint ($\\omega = 0$); when $\\omega \\neq 0$, the rotating velocity vector traces a circular arc integrated by $G(\\theta)v$!',
          },
          {
            id: 'b',
            latex: '\\begin{bmatrix} e^{[\\omega]\\theta} & e^{[\\omega]\\theta} v \\\\ 0^T & 1 \\end{bmatrix}',
            correct: false,
            misconception:
              'At $\\theta = 0$, $e^{[\\omega]0} v = v \\neq 0$, which fails to recover the identity matrix $I_4$!',
          },
          {
            id: 'c',
            latex: '\\begin{bmatrix} e^{[\\omega]\\theta} & G(\\theta)v \\\\ 0^T & 1 \\end{bmatrix}, \\quad G(\\theta)=I\\theta + (1-c_\\theta)[\\omega] + (\\theta-s_\\theta)[\\omega]^2',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\begin{bmatrix} I + \\theta[\\omega] & G(\\theta)v \\\\ 0^T & 1 \\end{bmatrix}, \\quad G(\\theta) = I\\theta',
            correct: false,
            misconception:
              'Truncating $e^{[\\omega]\\theta} \\approx I + \\theta[\\omega]$ is only a first-order small-angle approximation and leaves $SO(3)$ for finite angles $\\theta$!',
          },
        ],
        lockedLabel: 'SE(3) Exponential Map',
        lockedResultLatex: 'e^{[\\mathcal{S}]\\theta} = \\textcolor{#34D399}{\\begin{bmatrix} e^{[\\omega]\\theta} & G(\\theta)v \\\\ 0^T & 1 \\end{bmatrix}} \\in SE(3)',
        hint: 'Notice $G(\\theta) = \\int_0^\\theta e^{[\\omega]\\tau}\\,d\\tau$: integrate $I + \\sin\\tau[\\omega] + (1-\\cos\\tau)[\\omega]^2$ term by term from $0$ to $\\theta$!',
      },
      {
        stepType: 'se3_gimbal_lock',
        badge: 'Why SE(3) Lie Groups Eliminate Gimbal Lock',
        whyThisStep:
          'Understanding the topological reason Euler angles fail explains why spacecraft, quadrotors, and SOTA robot kinematics represent pose directly on $SE(3)$ (or unit quaternions + $\\mathbb{R}^3$).',
        systemImpact:
          'Because $SO(3)$ is a curved compact manifold with no global singularity-free 3-parameter coordinate chart, operating directly on $SE(3)$ with tangent twists $\\mathfrak{se}(3)$ keeps orientation smooth, coordinate-free, and immune to gimbal lock at every attitude.',
        prompt:
          'Why does $SE(3)$ Lie-group kinematics completely avoid the Euler-angle gimbal-lock singularity?',
        highlightLatex:
          '\\text{Euler } (\\phi,\\theta,\\psi)\\in\\mathbb{R}^3 \\;\\text{(singular at }\\theta=\\pm 90^\\circ\\text{)} \\quad\\text{vs.}\\quad \\textcolor{#34D399}{SE(3) \\text{ Manifold}}',
        options: [
          {
            id: 'a',
            latex: '\\text{It restricts robot orientations to small angles } |\\theta| < 45^\\circ \\text{ where Euler angles stay invertible}',
            correct: false,
            misconception:
              '$SE(3)$ handles arbitrary full-sphere 3D rotations ($360^\\circ$ tumbles, inverted wrists, aerobatic drones) with zero angle restrictions!',
          },
          {
            id: 'b',
            latex: '\\text{It represents pose globally on the smooth manifold } SE(3) \\text{ via } \\exp/\\log \\text{ maps, avoiding local 3-angle charts}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Because } SE(3) \\text{ is a flat Euclidean vector space where } R_1 + R_2 \\in SO(3)',
            correct: false,
            misconception:
              '$SO(3)$ and $SE(3)$ are curved matrix Lie groups, NOT vector spaces — adding two rotation matrices does not stay in $SO(3)$!',
          },
          {
            id: 'd',
            latex: '\\text{Because Rodrigues’ formula converts every 3D rotation into a single scalar angle}',
            correct: false,
            misconception:
              'A 3D rotation has 3 degrees of freedom (unit axis $\\omega \\in S^2$ plus angle $\\theta$), never a single scalar.',
          },
        ],
        lockedLabel: 'Singularity-Free SE(3)',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Global manifold } SE(3) + \\mathfrak{se}(3) \\text{ twists} \\implies \\text{zero gimbal lock}}',
        hint: 'Gimbal lock is a coordinate-chart singularity (like longitude at the North Pole), not a flaw in 3D space itself.',
      },
    ],
  },

  {
    id: 'kin2-poe-3r-spatial',
    tier: 'poe-screw',
    tierLabel: 'SOTA: PoE & SE(3)',
    title: 'Modern SOTA Forward Kinematics: Product of Exponentials (PoE) on a 3R Spatial Arm',
    mechatronicsContext:
      'Now solve the exact same 3R spatial arm from Problem 2 using Brockett’s Product of Exponentials (PoE). Instead of agonizing over four intermediate DH frames and 90° link-twist signs, you define just TWO frames — Base {s} and Home Pose M — and read off three screw axes by visual inspection!',
    expressionLatex:
      'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} M',
    finalAnswerLatex:
      '\\mathcal{S}_1=(0,0,1,0,0,0)^T,\\; \\mathcal{S}_2=(0,-1,0,d_1,0,0)^T,\\; \\mathcal{S}_3=(0,-1,0,d_1,0,-L_2)^T',
    diagram: {
      type: 'screw-poe',
      variant: 'poe-3r',
      screw: 'S₁, S₂, S₃',
      formula: 'T = e^[S₁]θ₁…M',
      map: 'Only 2 Frames!',
      subtitle: 'Product of Exponentials — 3R Spatial Arm',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.5708],
      setpoint: 3.3,
      setpointLabel: 'Vertical Tip z = d₁+L₂+L₃ = 3.3',
      primaryLabel: 'PoE Height z(t) = 1.5 + 1.8 sin(t)',
      baselineLabel: 'PoE Reach x(t) = 1.8 cos(t)',
      primaryFn: (t) => 1.5 + 1.8 * Math.sin(t),
      baselineFn: (t) => 1.8 * Math.cos(t),
      tsMarker: { t: 1.5708, label: 'θ₂ = 90° → (0,0,3.3)', band: 0.05 },
      defaultCursor: 0.65,
      subtitle:
        'Hover across $t = \\theta_2 \\in [0, \\pi/2]\\text{ s}$ ($d_1=1.5, L_2=1.0, L_3=0.8$, $\\theta_1=\\theta_3=0$): the PoE exponential $e^{[\\mathcal{S}_2]\\theta_2} M$ smoothly lifts the stretched arm from $(1.8, 0, 1.5)$ straight up to $(0, 0, 3.3)$ (Emerald), matching Craig MDH to machine precision.',
      domainMeta: '3R Space PoE Verification · θ = (0, θ₂, 0) · Only 2 Frames ({s} & M)',
      metrics: [
        { label: 'Frames Needed', value: '2 Only ({s} & M)' },
        { label: 'Home Pose p_M', value: '[L₂+L₃, 0, d₁]ᵀ' },
        { label: 'At (0, 90°, 0)', value: '[0, 0, d₁+L₂+L₃]ᵀ' },
        { label: 'DH Matches PoE', value: 'Exact Identity ✓' },
      ],
    },
    steps: [
      {
        stepType: 'poe_home_pose',
        badge: 'Define Base {s} & Home Pose M ∈ SE(3)',
        whyThisStep:
          'Product of Exponentials completely eliminates intermediate link frames `{1}, {2}, {3}` — you only ever specify where the end-effector sits when all joint encoders read zero.',
        systemImpact:
          'Locking $M = \\begin{bmatrix}I_3 & p_M \\\\ 0^T & 1\\end{bmatrix}$ with $p_M = [L_2+L_3,\\; 0,\\; d_1]^T$ anchors the entire kinematic chain in a single visually obvious $4\\times 4$ matrix.',
        prompt:
          'With the 3R spatial arm at home ($\\theta_1 = \\theta_2 = \\theta_3 = 0$) stretched horizontally along $+x$ at height $z = d_1$ and tool axes aligned with base `{s}`, write the home pose matrix $M \\in SE(3)$.',
        highlightLatex:
          'M = T(\\mathbf{0}) = \\begin{bmatrix} \\textcolor{#22D3EE}{R_M} & \\textcolor{#F59E0B}{p_M} \\\\ 0^T & 1 \\end{bmatrix} \\in SE(3)',
        options: [
          {
            id: 'a',
            latex: 'R_M = I_3, \\qquad p_M = [L_2 + L_3,\\; 0,\\; d_1]^T',
            correct: true,
          },
          {
            id: 'b',
            latex: 'R_M = I_3, \\qquad p_M = [0,\\; 0,\\; d_1 + L_2 + L_3]^T',
            correct: false,
            misconception:
              'That home pose has the arm pointing straight UP along $+z$; the specification stretches the arm horizontally along $+x$ at height $d_1$.',
          },
          {
            id: 'c',
            latex: 'R_M = \\operatorname{Rot}_x(90^\\circ), \\qquad p_M = [L_2 + L_3,\\; 0,\\; 0]^T',
            correct: false,
            misconception:
              'Unlike DH, PoE does NOT force you to twist the tool frame by $90^\\circ$, and you cannot drop the base pedestal height $d_1$!',
          },
          {
            id: 'd',
            latex: 'R_M = I_3, \\qquad p_M = [L_2,\\; L_3,\\; d_1]^T',
            correct: false,
            misconception:
              'At $\\theta = 0$, both upper arm $L_2$ and forearm $L_3$ lie collinearly along $+x$, so $x_M = L_2 + L_3$ and $y_M = 0$.',
          },
        ],
        lockedLabel: 'Home Pose M',
        lockedResultLatex: 'M:\\; \\textcolor{#34D399}{R_M = I_3,\\quad p_M = [L_2 + L_3,\\; 0,\\; d_1]^T}',
        hint: 'Walk from base origin $(0,0,0)$ up the pedestal ($+d_1$ along $z$) and out the stretched arm ($+(L_2+L_3)$ along $x$).',
      },
      {
        stepType: 'poe_screw1',
        badge: 'Extract Space Screw S₁ (Base Waist Yaw)',
        whyThisStep:
          'Every space screw $\\mathcal{S}_i = (\\omega_i, v_i)$ is read directly from the robot’s ZERO configuration in the fixed base frame `{s}` — zero frame-chasing required!',
        systemImpact:
          'Because joint 1’s vertical yaw axis $+\\hat{z}$ passes right through the base origin $q_1 = (0,0,0)$, its velocity moment vanishes ($v_1 = 0$), giving $\\mathcal{S}_1 = [0, 0, 1, 0, 0, 0]^T$.',
        prompt:
          'Extract the 6D space-frame unit screw axis $\\mathcal{S}_1 = (\\omega_1, v_1)$ for base waist joint 1 rotating CCW about $+\\hat{z}$ through the origin.',
        highlightLatex:
          '\\omega_1 = \\textcolor{#22D3EE}{[0, 0, 1]^T}, \\qquad q_1 = [0, 0, 0]^T, \\qquad v_1 = -\\omega_1 \\times q_1',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{S}_1 = [0,\\; 0,\\; 1,\\; 0,\\; 0,\\; d_1]^T',
            correct: false,
            misconception:
              'A point $q_1 = [0, 0, d_1]^T$ also lies on the $z$-axis, and $-\\hat{z} \\times (d_1 \\hat{z}) = 0$! Putting $d_1$ in $v_{1z}$ would turn joint 1 into a helical corkscrew instead of a pure revolute joint.',
          },
          {
            id: 'b',
            latex: '\\mathcal{S}_1 = [0,\\; 0,\\; 1,\\; 0,\\; 0,\\; 0]^T',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{S}_1 = [0,\\; 0,\\; 0,\\; 0,\\; 0,\\; 1]^T',
            correct: false,
            misconception:
              'Having $\\omega_1 = 0$ and $v_1 = [0, 0, 1]^T$ describes a pure vertical PRISMATIC slider, not a revolute yaw joint!',
          },
          {
            id: 'd',
            latex: '\\mathcal{S}_1 = [1,\\; 0,\\; 0,\\; 0,\\; 0,\\; 0]^T',
            correct: false,
            misconception:
              'Base yaw rotates around vertical $+\\hat{z}$ (index 3), not horizontal $+\\hat{x}$ (index 1).',
          },
        ],
        lockedLabel: 'Space Screw S₁',
        lockedResultLatex: '\\mathcal{S}_1 = \\textcolor{#34D399}{[0,\\; 0,\\; 1,\\; 0,\\; 0,\\; 0]^T}',
        hint: 'Any point on the $z$-axis is parallel to $\\omega_1 = \\hat{z}$, so $-\\omega_1 \\times q_1 = 0$.',
      },
      {
        stepType: 'poe_screw2',
        badge: 'Extract Space Screw S₂ (Shoulder Pitch)',
        whyThisStep:
          'To make positive $\\theta_2$ lift the horizontally stretched arm upward from $+x$ toward $+z$, the right-hand rule fixes the exact unit axis $\\omega_2$ in base `{s}`.',
        systemImpact:
          'With $\\omega_2 = [0, -1, 0]^T$ through shoulder center $q_2 = [0, 0, d_1]^T$, $v_2 = -\\omega_2 \\times q_2 = [+d_1, 0, 0]^T$ encodes the exact pivot height without any link-twist matrix.',
        prompt:
          'Joint 2 pitches the arm upward from $+x$ toward $+z$ around axis $\\omega_2 = [0, -1, 0]^T$ passing through $q_2 = [0, 0, d_1]^T$. Compute $\\mathcal{S}_2 = (\\omega_2, v_2)$.',
        highlightLatex:
          '\\omega_2 = \\textcolor{#22D3EE}{[0, -1, 0]^T}, \\qquad q_2 = \\textcolor{#F59E0B}{[0, 0, d_1]^T}, \\qquad v_2 = -\\omega_2 \\times q_2',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{S}_2 = [0,\\; -1,\\; 0,\\; -d_1,\\; 0,\\; 0]^T',
            correct: false,
            misconception:
              'Check the double negative! $\\omega_2 \\times q_2 = (-\\hat{y}) \\times (d_1\\hat{z}) = -d_1\\hat{x}$, so $v_2 = -(\\omega_2 \\times q_2) = +d_1\\hat{x}$.',
          },
          {
            id: 'b',
            latex: '\\mathcal{S}_2 = [0,\\; -1,\\; 0,\\; 0,\\; 0,\\; d_1]^T',
            correct: false,
            misconception:
              'Cross product $(-\\hat{y}) \\times \\hat{z}$ points along $\\hat{x}$, never $\\hat{z}$! Remember $v_2 \\perp \\omega_2$ and $v_2 \\perp q_2$.',
          },
          {
            id: 'c',
            latex: '\\mathcal{S}_2 = [0,\\; -1,\\; 0,\\; d_1,\\; 0,\\; 0]^T',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathcal{S}_2 = [0,\\; 1,\\; 0,\\; d_1,\\; 0,\\; 0]^T',
            correct: false,
            misconception:
              'By the right-hand rule, rotating $+x$ upward toward $+z$ requires your thumb along $-\\hat{y}$ ($\\omega_2 = [0, -1, 0]^T$); $+\\hat{y}$ pitches the arm downward!',
          },
        ],
        lockedLabel: 'Space Screw S₂',
        lockedResultLatex: '\\mathcal{S}_2 = \\textcolor{#34D399}{[0,\\; -1,\\; 0,\\; d_1,\\; 0,\\; 0]^T}',
        hint: 'Use $\\hat{y} \\times \\hat{z} = +\\hat{x}$, so $-(-\\hat{y}) \\times (d_1 \\hat{z}) = +d_1 \\hat{x}$.',
      },
      {
        stepType: 'poe_screw3',
        badge: 'Extract Space Screw S₃ (Elbow Pitch)',
        whyThisStep:
          'Joint 3 is parallel to joint 2 but shifted outward by $L_2$ along $+x$ at home — computing $-\\omega_3 \\times q_3$ captures BOTH the height $d_1$ and the horizontal arm reach $L_2$ in one vector.',
        systemImpact:
          'Evaluating $v_3 = -(0,-1,0)^T \\times (L_2, 0, d_1)^T = [d_1, 0, -L_2]^T$ reflects physical intuition immediately: spinning upward around the elbow moves a rigid point at the origin forward by $+d_1$ and downward by $-L_2$.',
        prompt:
          'Compute space screw $\\mathcal{S}_3 = (\\omega_3, v_3)$ for elbow pitch $\\omega_3 = [0, -1, 0]^T$ passing through $q_3 = [L_2, 0, d_1]^T$ at home.',
        highlightLatex:
          '\\omega_3 = \\textcolor{#22D3EE}{[0, -1, 0]^T}, \\qquad q_3 = \\textcolor{#F59E0B}{[L_2, 0, d_1]^T}, \\qquad v_3 = -\\omega_3 \\times q_3',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{S}_3 = [0,\\; -1,\\; 0,\\; d_1,\\; 0,\\; +L_2]^T',
            correct: false,
            misconception:
              'Check the $z$-component: $\\hat{y} \\times (L_2 \\hat{x}) = -L_2 \\hat{z}$, so $v_3 = +\\hat{y} \\times (L_2\\hat{x} + d_1\\hat{z}) = d_1\\hat{x} - L_2\\hat{z}$!',
          },
          {
            id: 'b',
            latex: '\\mathcal{S}_3 = [0,\\; -1,\\; 0,\\; 0,\\; 0,\\; -L_2]^T',
            correct: false,
            misconception:
              'Do not forget the shoulder height $d_1$ in $q_3 = [L_2, 0, d_1]^T$! Every space screw is referenced to the fixed base origin $(0,0,0)$.',
          },
          {
            id: 'c',
            latex: '\\mathcal{S}_3 = [0,\\; -1,\\; 0,\\; -L_2,\\; 0,\\; d_1]^T',
            correct: false,
            misconception:
              'You swapped the $x$ and $z$ components of the cross product! $\\hat{y} \\times \\hat{z} = +\\hat{x}$ gives $v_{3x} = d_1$, while $\\hat{y} \\times \\hat{x} = -\\hat{z}$ gives $v_{3z} = -L_2$.',
          },
          {
            id: 'd',
            latex: '\\mathcal{S}_3 = [0,\\; -1,\\; 0,\\; d_1,\\; 0,\\; -L_2]^T',
            correct: true,
          },
        ],
        lockedLabel: 'Space Screw S₃',
        lockedResultLatex: '\\mathcal{S}_3 = \\textcolor{#34D399}{[0,\\; -1,\\; 0,\\; d_1,\\; 0,\\; -L_2]^T}',
        hint: 'Notice $-\\omega_3 = +\\hat{y}$, so $v_3 = \\hat{y} \\times (L_2 \\hat{x} + d_1 \\hat{z}) = L_2(-\\hat{z}) + d_1(+\\hat{x})$.',
      },
      {
        stepType: 'poe_assemble_eval',
        badge: 'Assemble Space PoE & Evaluate at (0, 90°, 0)',
        whyThisStep:
          'In Space-Frame PoE, joints closer to the base act on the LEFT so each proximal screw rotates the entire distal chain about its fixed home axis, with $M$ multiplied last on the RIGHT.',
        systemImpact:
          'Evaluating $T(0, 90^\\circ, 0) = e^{[\\mathcal{S}_2]\\pi/2} M$ swings the horizontal arm $(L_2+L_3)$ straight up above the shoulder pivot $(0,0,d_1)$ to $[0,\\; 0,\\; d_1 + L_2 + L_3]^T$ — matching Problem 2’s MDH formula identically!',
        prompt:
          'Select the exact Space-Frame PoE forward kinematics formula AND evaluate end-effector position $p_e$ at $\\theta = (0,\\; 90^\\circ,\\; 0)$.',
        highlightLatex:
          'T(\\theta) = \\textcolor{#22D3EE}{\\prod_{i=1}^{3} e^{[\\mathcal{S}_i]\\theta_i}} \\cdot \\textcolor{#F59E0B}{M}, \\qquad \\theta = (0,\\; 90^\\circ,\\; 0)',
        options: [
          {
            id: 'a',
            latex: 'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} M \\implies p_e = [0,\\; 0,\\; d_1 + L_2 + L_3]^T',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T(\\theta) = M\\, e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} \\implies p_e = [0,\\; 0,\\; d_1 + L_2 + L_3]^T',
            correct: false,
            misconception:
              'Home pose $M$ goes on the RIGHT for Space screws $\\mathcal{S}_i$! Putting $M$ on the left requires Body-frame screws $\\mathcal{B}_i$.',
          },
          {
            id: 'c',
            latex: 'T(\\theta) = e^{[\\mathcal{S}_3]\\theta_3} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_1]\\theta_1} M \\implies p_e = [0,\\; 0,\\; d_1 + L_2 + L_3]^T',
            correct: false,
            misconception:
              'Reversing the exponential order applies joint 1 first and then pitches around the UNROTATED base axis $\\mathcal{S}_2$ — breaking spatial coupling when $\\theta_1 \\neq 0$!',
          },
          {
            id: 'd',
            latex: 'T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} M \\implies p_e = [0,\\; 0,\\; L_2 + L_3 - d_1]^T',
            correct: false,
            misconception:
              'Check $G(\\pi/2)v_2 = [d_1, 0, d_1]^T$ added to $R p_M = [-d_1, 0, L_2+L_3]^T$: the $-d_1$ cancels in $x$, while $z = L_2 + L_3 + d_1$!',
          },
        ],
        lockedLabel: 'Space PoE Verified',
        lockedResultLatex: '\\textcolor{#34D399}{T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1} e^{[\\mathcal{S}_2]\\theta_2} e^{[\\mathcal{S}_3]\\theta_3} M,\\quad p_e = [0, 0, d_1+L_2+L_3]^T}',
        hint: 'Space PoE multiplies $1 \\to 2 \\to 3$ from left to right with $M$ on the far right; pitching $+90^\\circ$ stands the arm straight up above $(0,0,d_1)$.',
      },
      {
        stepType: 'poe_vs_dh_sota',
        badge: 'Why URDF / Pinocchio / MuJoCo Use Screws + Fixed Transforms',
        whyThisStep:
          'Connecting textbook PoE directly to the actual file formats and physics engines running real humanoids and manipulators bridges theory into production robotics engineering.',
        systemImpact:
          'Modern engines (URDF, SDF, MJCF/MuJoCo, Pinocchio, Drake) store each joint as a fixed parent-to-joint transform plus a single joint screw/axis — completely eliminating DH’s artificial common-normal rules, parallel-axis singularities, and branching-tree headaches.',
        prompt:
          'Why have modern robotics simulators and kinematics engines (URDF, Pinocchio, MuJoCo, Drake) abandoned classical DH tables in favor of joint screws + fixed transforms (PoE)?',
        highlightLatex:
          '\\text{URDF / Pinocchio / MuJoCo}:\\quad T_{\\text{parent}\\to\\text{child}}(q_i) = \\textcolor{#22D3EE}{T_{\\text{origin},i}} \\cdot \\textcolor{#F59E0B}{e^{[\\mathcal{S}_i]q_i}}',
        options: [
          {
            id: 'a',
            latex: '\\text{DH tables cannot mathematically represent 6-DOF or 7-DOF serial arms}',
            correct: false,
            misconception:
              'DH CAN represent any open serial chain (including 6-DOF and 7-DOF arms) — its drawbacks are frame-assignment fragility, parallel-axis calibration jumps, and awkward branching trees.',
          },
          {
            id: 'b',
            latex: '\\text{PoE avoids arbitrary common-normal rules, has no parallel-axis calibration jump, and handles arbitrary kinematic trees natively}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{PoE eliminates the need to know link lengths } L_2, L_3 \\text{ during forward kinematics}',
            correct: false,
            misconception:
              'Link dimensions are still encoded inside the screw moments $v_i = -\\omega_i \\times q_i$ and home pose $M$ (or fixed joint origins $T_{\\text{origin},i}$).',
          },
          {
            id: 'd',
            latex: '\\text{PoE turns nonlinear trigonometric forward kinematics into a linear matrix equation } p_e = A\\theta',
            correct: false,
            misconception:
              'Forward kinematics on $SE(3)$ is still nonlinear in $\\theta$ (via $\\sin\\theta, \\cos\\theta$ inside Rodrigues’ formula); only instantaneous velocities $\\mathcal{V} = J(\\theta)\\dot{\\theta}$ are linear.',
          },
        ],
        lockedLabel: 'SOTA PoE Advantage',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Zero common-normal hacks, smooth calibration, native multi-arm trees}}',
        hint: 'Think about what disappears when you only need base `{s}`, home `M`, and physical joint axes directly from CAD.',
      },
    ],
  },

  {
    id: 'kin2-body-poe-adjoint',
    tier: 'poe-screw',
    tierLabel: 'SOTA: PoE & SE(3)',
    title: 'Body-Frame PoE, 6×6 Adjoint Map Ad_T & Bridge to Parallel Mechanisms',
    mechatronicsContext:
      'Tool-frame control (drilling along a surface normal, teleoperation, force-torque sensing at the wrist) lives in the end-effector Body frame {b}. The 6×6 Adjoint map Ad_T is the universal translator of twists and wrenches between frames — and the exact algebraic gateway to closed-chain Parallel Manipulators.',
    expressionLatex:
      'T(\\theta)=M\\,e^{[\\mathcal{B}_1]\\theta_1}\\!\\cdots\\,e^{[\\mathcal{B}_n]\\theta_n},\\; \\mathcal{S}_i=\\operatorname{Ad}_M\\mathcal{B}_i',
    finalAnswerLatex:
      '\\operatorname{Ad}_T=\\begin{bmatrix}R&0\\\\[p]R&R\\end{bmatrix},\\; \\mathcal{S}_i=\\operatorname{Ad}_M\\mathcal{B}_i,\\; \\mathcal{F}_b=\\operatorname{Ad}_{T_{sb}}^T\\mathcal{F}_s',
    diagram: {
      type: 'screw-poe',
      variant: 'body-adjoint',
      screw: 'Sᵢ = Ad_M · Bᵢ',
      formula: 'T = M·e^[B₁]θ₁…',
      map: 'Twists & Wrenches',
      subtitle: 'Body PoE & Adjoint Transformation',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.0],
      setpoint: 1.0,
      setpointLabel: 'Power Invariance Ratio = 1.0',
      primaryLabel: 'Body Power 𝓕_bᵀ 𝒱_b (W)',
      baselineLabel: 'Space Power 𝓕_sᵀ 𝒱_s (W)',
      primaryFn: (t) => 1.0 + 0.55 * Math.sin(2.4 * t) * Math.exp(-0.25 * t),
      baselineFn: (t) => 1.0 + 0.55 * Math.sin(2.4 * t) * Math.exp(-0.25 * t),
      defaultCursor: 0.45,
      subtitle:
        'Hover across time $t$: mechanical power is frame-invariant, so $\\mathcal{F}_b^T \\mathcal{V}_b$ (Emerald) and $\\mathcal{F}_s^T \\mathcal{V}_s$ (Cyan dashed) overlap identically at every instant — proving the dual wrench law $\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s$.',
      domainMeta: 'Adjoint Duality · Power Invariance 𝓕_bᵀ𝒱_b ≡ 𝓕_sᵀ𝒱_s',
      metrics: [
        { label: 'Body PoE', value: 'M · exp([ℬ₁]θ₁)···' },
        { label: 'Adjoint Ad_T', value: '6×6 [R, 0; [p]R, R]' },
        { label: 'Wrench Dual', value: '𝓕_b = Adᵀ(T_sb) 𝓕_s' },
        { label: 'Parallel Bridge', value: 'Reciprocal Wrenches ✓' },
      ],
    },
    steps: [
      {
        stepType: 'body_poe_formula',
        badge: 'Write the Body-Frame PoE Formula',
        whyThisStep:
          'When all joint screw axes $\\mathcal{B}_i$ are measured in the end-effector’s home frame `{b}` instead of base `{s}`, every exponential post-multiplies on the right — shifting $M$ to the far left.',
        systemImpact:
          'Because $T(\\theta) = M e^{[\\mathcal{B}_1]\\theta_1}\\cdots e^{[\\mathcal{B}_n]\\theta_n}$ puts $M$ on the left, Body PoE is algebraically identical to Space PoE while directly yielding the Body Jacobian $J_b(\\theta)$ for tool-tip impedance control.',
        prompt:
          'Given home pose $M \\in SE(3)$ and joint screw axes $\\mathcal{B}_1, \\dots, \\mathcal{B}_n$ expressed in the end-effector home frame $\\{b\\}$, select the exact Body-Frame PoE formula.',
        highlightLatex:
          '\\text{Space PoE: } e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_n]\\theta_n} M \\quad\\Longleftrightarrow\\quad \\text{Body PoE: } \\textcolor{#F59E0B}{?}',
        options: [
          {
            id: 'a',
            latex: 'T(\\theta) = e^{[\\mathcal{B}_1]\\theta_1} e^{[\\mathcal{B}_2]\\theta_2}\\cdots e^{[\\mathcal{B}_n]\\theta_n} M',
            correct: false,
            misconception:
              'Keeping $M$ on the right requires SPACE-frame screws $\\mathcal{S}_i$; body screws $\\mathcal{B}_i$ act in the moving tool frame so $M$ must sit on the LEFT.',
          },
          {
            id: 'b',
            latex: 'T(\\theta) = M\\, e^{[\\mathcal{B}_1]\\theta_1} e^{[\\mathcal{B}_2]\\theta_2}\\cdots e^{[\\mathcal{B}_n]\\theta_n}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'T(\\theta) = M\\, e^{[\\mathcal{B}_n]\\theta_n}\\cdots e^{[\\mathcal{B}_2]\\theta_2} e^{[\\mathcal{B}_1]\\theta_1}',
            correct: false,
            misconception:
              'Do NOT reverse the joint order! Conjugate $M e^{[\\mathcal{B}_i]\\theta_i} M^{-1} = e^{[\\mathcal{S}_i]\\theta_i}$ telescopes from $1$ to $n$ in the EXACT same order $1, 2, \\dots, n$.',
          },
          {
            id: 'd',
            latex: 'T(\\theta) = M^{-1}\\, e^{[\\mathcal{B}_1]\\theta_1}\\cdots e^{[\\mathcal{B}_n]\\theta_n}',
            correct: false,
            misconception:
              'Check $\\theta = 0$: $T(0)$ must equal $+M$, not $M^{-1}$!',
          },
        ],
        lockedLabel: 'Body-Frame PoE',
        lockedResultLatex: 'T(\\theta) = \\textcolor{#34D399}{M\\, e^{[\\mathcal{B}_1]\\theta_1}\\cdots e^{[\\mathcal{B}_n]\\theta_n}}',
        hint: 'Insert $M M^{-1} = I$ repeatedly into Space PoE from left to right and watch $M$ slide to the front!',
      },
      {
        stepType: 'adjoint_matrix',
        badge: 'Construct the 6×6 Adjoint Matrix Ad_T',
        whyThisStep:
          'Unlike a free 3D vector rotated simply by $R$, a 6D spatial twist $\\mathcal{V} = (\\omega, v)$ changes its linear velocity component by $p \\times \\omega$ whenever you shift the reference origin by $p$.',
        systemImpact:
          'The block lower-triangular matrix $\\operatorname{Ad}_T = \\begin{bmatrix}R & 0 \\\\ [p]R & R\\end{bmatrix}$ maps any 6D twist linearly across frames ($\\mathcal{V}_s = \\operatorname{Ad}_{T_{sb}}\\mathcal{V}_b$) while preserving the Lie bracket structure.',
        prompt:
          'For a rigid transform $T = \\begin{bmatrix}R & p \\\\ 0^T & 1\\end{bmatrix} \\in SE(3)$ and twist $\\mathcal{V} = \\begin{bmatrix}\\omega \\\\ v\\end{bmatrix} \\in \\mathbb{R}^6$, select the exact $6\\times 6$ Adjoint representation $\\operatorname{Ad}_T$ satisfying $[\\operatorname{Ad}_T \\mathcal{V}] = T[\\mathcal{V}]T^{-1}$.',
        highlightLatex:
          'T \\begin{bmatrix}[\\omega] & v \\\\ 0^T & 0\\end{bmatrix} T^{-1} = \\begin{bmatrix}[R\\omega] & \\textcolor{#F59E0B}{p\\times(R\\omega) + Rv} \\\\ 0^T & 0\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: '\\operatorname{Ad}_T = \\begin{bmatrix} R & 0 \\\\ 0 & R \\end{bmatrix}',
            correct: false,
            misconception:
              'Dropping the off-diagonal $[p]R$ block ignores the lever-arm velocity $p \\times (R\\omega)$ induced when shifting frames by translation $p$!',
          },
          {
            id: 'b',
            latex: '\\operatorname{Ad}_T = \\begin{bmatrix} R & [p]R \\\\ 0 & R \\end{bmatrix}',
            correct: false,
            misconception:
              'Angular velocity $\\omega_s = R\\omega_b$ NEVER depends on linear velocity $v_b$! The $[p]R$ coupling sits in the LOWER-left block (affecting $v_s$), not upper-right.',
          },
          {
            id: 'c',
            latex: '\\operatorname{Ad}_T = \\begin{bmatrix} R & 0 \\\\ [p]R & R \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\operatorname{Ad}_T = \\begin{bmatrix} R^T & 0 \\\\ -[p]R^T & R^T \\end{bmatrix}',
            correct: false,
            misconception:
              'Wait — check the forward transform: $T[\\mathcal{V}]T^{-1}$ uses $+R$ and $+[p]R$; the matrix with $R^T$ is close to the inverse $\\operatorname{Ad}_{T^{-1}} = \\begin{bmatrix}R^T & 0 \\\\ -R^T[p] & R^T\\end{bmatrix}$.',
          },
        ],
        lockedLabel: '6×6 Adjoint Matrix',
        lockedResultLatex: '\\operatorname{Ad}_T = \\textcolor{#34D399}{\\begin{bmatrix} R & 0 \\\\ [p]R & R \\end{bmatrix}}',
        hint: 'Match the two rows: $\\omega_s = R\\omega_b$ (upper block $[R,\\; 0]$) and $v_s = [p]R\\omega_b + R v_b$ (lower block $[[p]R,\\; R]$).',
      },
      {
        stepType: 'space_body_screw_link',
        badge: 'Prove Space-to-Body Screw Equivalence via Ad_M',
        whyThisStep:
          'You never need to re-derive a robot’s screw table from scratch when switching between Space and Body kinematics — a single $6\\times 6$ multiplication converts the entire chain.',
        systemImpact:
          'Because matrix conjugation satisfies $M e^{[\\mathcal{B}_i]\\theta_i} M^{-1} = e^{M[\\mathcal{B}_i]M^{-1}\\theta_i} = e^{[\\operatorname{Ad}_M\\mathcal{B}_i]\\theta_i}$, setting $\\mathcal{S}_i = \\operatorname{Ad}_M \\mathcal{B}_i$ proves $e^{[\\mathcal{S}_i]\\theta_i} M = M e^{[\\mathcal{B}_i]\\theta_i}$ identically.',
        prompt:
          'How are Space screw $\\mathcal{S}_i$ and Body screw $\\mathcal{B}_i$ related by the home pose $M \\in SE(3)$, and which matrix identity proves Space PoE $\\equiv$ Body PoE?',
        highlightLatex:
          '\\textcolor{#22D3EE}{e^{[\\mathcal{S}_i]\\theta_i} M} = \\textcolor{#F59E0B}{M e^{[\\mathcal{B}_i]\\theta_i}} \\;\\Longleftrightarrow\\; M [\\mathcal{B}_i] M^{-1} = [\\mathcal{S}_i]',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{S}_i = \\operatorname{Ad}_M \\mathcal{B}_i \\quad\\text{via}\\quad M e^{[\\mathcal{B}_i]\\theta_i} M^{-1} = e^{[\\operatorname{Ad}_M \\mathcal{B}_i]\\theta_i}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\mathcal{S}_i = \\operatorname{Ad}_M^T \\mathcal{B}_i \\quad\\text{via}\\quad M^T e^{[\\mathcal{B}_i]\\theta_i} M = e^{[\\mathcal{S}_i]\\theta_i}',
            correct: false,
            misconception:
              'The transpose $\\operatorname{Ad}^T$ transforms WRENCHES (forces/moments), not twists/screws! Twists transform via $\\operatorname{Ad}_M$ directly.',
          },
          {
            id: 'c',
            latex: '\\mathcal{S}_i = \\operatorname{Ad}_{M^{-1}} \\mathcal{B}_i \\quad\\text{via}\\quad M^{-1} e^{[\\mathcal{B}_i]\\theta_i} M = e^{[\\mathcal{S}_i]\\theta_i}',
            correct: false,
            misconception:
              'That maps in the reverse direction: $\\mathcal{B}_i = \\operatorname{Ad}_{M^{-1}} \\mathcal{S}_i$ (space to body), whereas body to space uses $\\operatorname{Ad}_M$.',
          },
          {
            id: 'd',
            latex: '\\mathcal{S}_i = \\mathcal{B}_i + M \\quad\\text{for all revolute joints}',
            correct: false,
            misconception:
              'You cannot add a $6\\times 1$ screw vector to a $4\\times 4$ homogeneous matrix $M$!',
          },
        ],
        lockedLabel: 'Space-Body Screw Link',
        lockedResultLatex: '\\textcolor{#34D399}{\\mathcal{S}_i = \\operatorname{Ad}_M \\mathcal{B}_i \\iff e^{[\\mathcal{S}_i]\\theta_i} M = M e^{[\\mathcal{B}_i]\\theta_i}}',
        hint: 'Apply the similarity identity $P e^A P^{-1} = e^{P A P^{-1}}$ with $P = M$ and $A = [\\mathcal{B}_i]\\theta_i$.',
      },
      {
        stepType: 'wrench_adjoint_dual',
        badge: 'Transform 6D Wrenches via Dual Transpose Adᵀ',
        whyThisStep:
          'When a 6-axis wrist force-torque sensor measures contact wrench $\\mathcal{F}_b = (m_b, f_b)$ in the tool frame, impedance controllers need its exact equivalent $\\mathcal{F}_s$ in the base frame — governed by conservation of power.',
        systemImpact:
          'Equating instantaneous power $\\mathcal{F}_b^T \\mathcal{V}_b = \\mathcal{F}_s^T \\mathcal{V}_s = \\mathcal{F}_s^T \\operatorname{Ad}_{T_{sb}} \\mathcal{V}_b$ forces $\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s$ — cleanly encoding both force rotation and moment transfer $m = r \\times f$.',
        prompt:
          'Using power invariance $\\mathcal{F}_b^T \\mathcal{V}_b = \\mathcal{F}_s^T \\mathcal{V}_s$ and $\\mathcal{V}_s = \\operatorname{Ad}_{T_{sb}} \\mathcal{V}_b$, derive the exact transformation for 6D spatial wrenches $\\mathcal{F} = (m, f)$.',
        highlightLatex:
          '\\mathcal{F}_b^T \\mathcal{V}_b = \\mathcal{F}_s^T (\\textcolor{#22D3EE}{\\operatorname{Ad}_{T_{sb}}} \\mathcal{V}_b) \\quad \\forall\\, \\mathcal{V}_b \\in \\mathbb{R}^6',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}} \\mathcal{F}_s',
            correct: false,
            misconception:
              'Wrenches are covectors (dual to twists)! Using $\\operatorname{Ad}_{T_{sb}}$ transforms in the wrong direction and puts the lever-arm moment in the force slot instead of the torque slot.',
          },
          {
            id: 'b',
            latex: '\\mathcal{F}_s = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_b',
            correct: false,
            misconception:
              'Careful with the index order! From $\\mathcal{F}_b^T = \\mathcal{F}_s^T \\operatorname{Ad}_{T_{sb}}$, taking the transpose of both sides yields $\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s$ (so $\\mathcal{F}_s = \\operatorname{Ad}_{T_{bs}}^T \\mathcal{F}_b$).',
          },
          {
            id: 'c',
            latex: '\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\mathcal{F}_b = -\\operatorname{Ad}_{T_{sb}}^{-1} \\mathcal{F}_s',
            correct: false,
            misconception:
              'Power invariance requires the transpose $\\operatorname{Ad}_{T_{sb}}^T$ (whose upper-right block $R^T [p]^T = -R^T[p]$ adds moment $r \\times f$), not a negated inverse.',
          },
        ],
        lockedLabel: 'Wrench Dual Law',
        lockedResultLatex: '\\textcolor{#34D399}{\\mathcal{F}_b = \\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s} \\quad (\\text{Power Invariance})',
        hint: 'Since $\\mathcal{F}_b^T \\mathcal{V}_b = (\\operatorname{Ad}_{T_{sb}}^T \\mathcal{F}_s)^T \\mathcal{V}_b$ holds for EVERY twist $\\mathcal{V}_b$, match the vectors directly.',
      },
      {
        stepType: 'parallel_screw_bridge',
        badge: 'Bridge Screw Theory to Parallel Manipulators',
        whyThisStep:
          'Serial arms are only half of industrial robotics — ultra-fast packaging Delta robots and 6-DOF flight-simulator Stewart-Gough hexapods are closed-chain parallel mechanisms where DH tables break down completely.',
        systemImpact:
          'In screw theory, every parallel leg transmits **reciprocal constraint wrenches** ($\\mathcal{F}_c^T \\mathcal{V} = 0$) to the moving platform: intersecting leg twist spaces (or summing constraint wrenches) immediately exposes platform mobility, stiffness, and parallel singularities!',
        prompt:
          'Why does Screw Theory (6D twists $\\mathcal{V}$ and reciprocal wrenches $\\mathcal{F}$) bridge effortlessly from serial arms to **closed-chain parallel manipulators** (Delta & Stewart-Gough)?',
        highlightLatex:
          '\\text{Reciprocal Constraint}:\\quad \\textcolor{#F59E0B}{\\mathcal{F}_{c,k}^T} \\textcolor{#22D3EE}{\\mathcal{V}_{\\text{platform}}} = 0 \\quad (\\text{Leg } k = 1,\\dots,m)',
        options: [
          {
            id: 'a',
            latex: '\\text{Parallel robots have no closed loops, so Space PoE chains all legs sequentially}',
            correct: false,
            misconception:
              'Parallel robots are defined by MULTIPLE closed kinematic loops acting in parallel on a single moving platform, never one open chain!',
          },
          {
            id: 'b',
            latex: '\\text{Each leg imposes reciprocal constraint wrenches } (\\mathcal{F}_c^T \\mathcal{V}=0)\\text{, unifying mobility, stiffness \\& parallel singularities}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Screw theory forces every parallel robot to have zero actuators}',
            correct: false,
            misconception:
              'Parallel robots typically place all actuators at the fixed base (reducing moving inertia) and use passive spherical/universal joints along the legs.',
          },
          {
            id: 'd',
            latex: '\\text{Because Adjoint matrices are always } 2\\times 2 \\text{ on Delta and Stewart platforms}',
            correct: false,
            misconception:
              'Spatial Delta and Stewart platforms operate in full 3D space, so their twists, wrenches, and Adjoint maps live in full 6D ($SE(3)$).',
          },
        ],
        lockedLabel: 'Parallel Bridge',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Twists \\& Reciprocal Wrenches } (\\mathcal{F}_c^T\\mathcal{V}=0) \\implies \\text{Delta \\& Stewart-Gough}}',
        hint: 'Think about how each leg of a Stewart-Gough or Delta robot restricts platform motion: forces that do zero work against allowed platform twists!',
      },
    ],
  },

  // =========================================================================
  // TIER 3: MANIPULATOR JACOBIANS, SINGULARITIES & FORCE DUALITY (2 problems)
  // =========================================================================
  {
    id: 'kin3-jacobian-singularities',
    tier: 'jacobians',
    tierLabel: 'Jacobians & Singularities',
    title: '2R Manipulator Jacobian J(θ), Singularities, Manipulability & Force Duality',
    mechatronicsContext:
      'The Jacobian J(θ) is the single most important matrix in robotic control: it converts joint speeds to Cartesian tip velocity (v = Jq̇), reveals where the arm locks up (det J = 0), shapes velocity/force ellipsoids (manipulability), and maps desired contact forces straight into motor torques (τ = JᵀF).',
    expressionLatex:
      '\\dot{x} = J(\\theta)\\dot{\\theta},\\; w = |\\det J|,\\; \\tau = J^T F',
    finalAnswerLatex:
      '\\det J = L_1 L_2 s_2,\\; w_{\\max}\\text{ at }\\theta_2=\\pm 90^\\circ,\\; \\tau=[-20,\\; 0]^T\\text{ N}\\!\\cdot\\!\\text{m}',
    diagram: {
      type: 'ik-solver-arch',
      variant: 'jacobian-ellipsoid',
      metric: 'w = |det J|',
      law: 'v = J q̇ , τ = Jᵀ F',
      badge: 'Manipulability',
      subtitle: 'Jacobian Ellipsoid & Static Force Duality',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 3.1416],
      setpoint: 2.0,
      setpointLabel: 'Peak Manipulability w_max = L₁L₂ = 2.0',
      primaryLabel: 'Yoshikawa w(t) = L₁L₂|sin θ₂(t)|',
      baselineLabel: 'Normalized σ_min(J) (L₁=2, L₂=1)',
      primaryFn: (t) => 2.0 * Math.abs(Math.sin(t)),
      baselineFn: (t) => {
        const s = Math.sin(t);
        const c = Math.cos(t);
        const tr = 5 + 4 * c + 1;
        const detSq = 4 * s * s;
        const disc = Math.sqrt(Math.max(0, tr * tr - 4 * detSq));
        return Math.sqrt(Math.max(0, 0.5 * (tr - disc)));
      },
      tsMarker: { t: 1.5708, label: 'Peak w at θ₂ = 90°', band: 0.04 },
      defaultCursor: 0.5,
      subtitle:
        'Hover across $t = \\theta_2 \\in [0, \\pi]\\text{ s}$ ($L_1=2, L_2=1$ at $1\\text{ rad/s}$): Yoshikawa manipulability $w = L_1 L_2|\\sin\\theta_2|$ (Emerald) and smallest singular value $\\sigma_{\\min}(J)$ (Cyan dashed) both collapse to $0$ at the singularities $\\theta_2 = 0, \\pi$ and peak cleanly around $\\theta_2 = 90^\\circ$.',
      domainMeta: '2R Manipulability Profile · θ₂: 0 → π · Singularities vs Peak Agility',
      metrics: [
        { label: 'det J(θ)', value: 'L₁ L₂ sin θ₂ (No θ₁!)' },
        { label: 'Singularities', value: 'θ₂ = 0 (Out) & π (In)' },
        { label: 'Max w = |det J|', value: 'θ₂ = ±90° (Isotropic)' },
        { label: 'Static Torque', value: 'τ₁=−20, τ₂=0 N·m ✓' },
      ],
    },
    steps: [
      {
        stepType: 'jac_2r_diff',
        badge: 'Differentiate 2R Forward Kinematics for J(θ)',
        whyThisStep:
          'Taking the exact partial derivatives $\\partial(x,y)/\\partial(\\theta_1,\\theta_2)$ linearizes nonlinear arm geometry around the current posture, creating the instantaneous velocity map $\\dot{x} = J(\\theta)\\dot{\\theta}$.',
        systemImpact:
          'Because $\\theta_1$ rotates BOTH links whereas $\\theta_2$ rotates ONLY link 2, Column 1 carries the full arm $(L_1, L_2)$ while Column 2 carries solely the forearm terms $(-L_2 s_{12},\\; L_2 c_{12})^T$.',
        prompt:
          'Differentiate $x = L_1 c_1 + L_2 c_{12}$ and $y = L_1 s_1 + L_2 s_{12}$ with respect to $(\\theta_1, \\theta_2)$ to assemble the $2\\times 2$ manipulator Jacobian $J(\\theta)$.',
        highlightLatex:
          'J(\\theta) = \\begin{bmatrix} \\frac{\\partial x}{\\partial \\theta_1} & \\frac{\\partial x}{\\partial \\theta_2} \\\\ \\frac{\\partial y}{\\partial \\theta_1} & \\frac{\\partial y}{\\partial \\theta_2} \\end{bmatrix}, \\qquad \\dot{p} = \\textcolor{#22D3EE}{J(\\theta)}\\textcolor{#F59E0B}{\\dot{\\theta}}',
        options: [
          {
            id: 'a',
            latex: 'J(\\theta) = \\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & -L_2 s_{12} \\\\ L_1 c_1 + L_2 c_{12} & L_2 c_{12} \\end{bmatrix}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'J(\\theta) = \\begin{bmatrix} -L_1 s_1 & -L_2 s_{12} \\\\ L_1 c_1 & L_2 c_{12} \\end{bmatrix}',
            correct: false,
            misconception:
              'By the chain rule, $\\frac{\\partial}{\\partial\\theta_1}(L_2 c_{12}) = -L_2 s_{12} \\neq 0$! Rotating shoulder joint 1 swings BOTH links together.',
          },
          {
            id: 'c',
            latex: 'J(\\theta) = \\begin{bmatrix} L_1 s_1 + L_2 s_{12} & L_2 s_{12} \\\\ -L_1 c_1 - L_2 c_{12} & -L_2 c_{12} \\end{bmatrix}',
            correct: false,
            misconception:
              'Flipped signs! Recall $\\frac{d}{d\\theta}\\cos\\theta = -\\sin\\theta$ (row 1 negative) and $\\frac{d}{d\\theta}\\sin\\theta = +\\cos\\theta$ (row 2 positive).',
          },
          {
            id: 'd',
            latex: 'J(\\theta) = \\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & L_1 c_1 + L_2 c_{12} \\\\ -L_2 s_{12} & L_2 c_{12} \\end{bmatrix}',
            correct: false,
            misconception:
              'That is the TRANSPOSE $J^T(\\theta)$ (used for torques $\\tau = J^T F$), not the velocity Jacobian $J(\\theta)$!',
          },
        ],
        lockedLabel: '2R Jacobian J(θ)',
        lockedResultLatex: 'J(\\theta) = \\textcolor{#34D399}{\\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & -L_2 s_{12} \\\\ L_1 c_1 + L_2 c_{12} & L_2 c_{12} \\end{bmatrix}}',
        hint: 'Apply $\\partial c_{12}/\\partial\\theta_1 = -s_{12}$ and $\\partial c_{12}/\\partial\\theta_2 = -s_{12}$, keeping $\\partial x$ on Row 1 and $\\partial y$ on Row 2.',
      },
      {
        stepType: 'jac_det',
        badge: 'Compute det J(θ) & Prove θ₁-Invariance',
        whyThisStep:
          'Evaluating the Jacobian determinant collapses four trigonometric entries into a single geometric scalar whose sign and zeros dictate workspace invertibility everywhere.',
        systemImpact:
          'Expanding $\\det J = L_1 L_2(c_1 s_{12} - s_1 c_{12}) = L_1 L_2 \\sin\\theta_2$ proves that kinematic dexterity depends ONLY on the internal elbow bend $\\theta_2$ — rotating the whole arm about base $\\theta_1$ preserves symmetry!',
        prompt:
          'Compute $\\det J(\\theta)$ and simplify using the sine difference identity $\\sin(A - B) = \\sin A \\cos B - \\cos A \\sin B$.',
        highlightLatex:
          '\\det J = (-L_1 s_1 - L_2 s_{12})(L_2 c_{12}) - (-L_2 s_{12})(L_1 c_1 + L_2 c_{12})',
        options: [
          {
            id: 'a',
            latex: '\\det J = L_1 L_2 \\cos\\theta_2',
            correct: false,
            misconception:
              'Check the trig identity: $s_{12} c_1 - c_{12} s_1 = \\sin((\\theta_1+\\theta_2) - \\theta_1) = \\sin\\theta_2$, NOT $\\cos\\theta_2$! At $\\theta_2 = 0$ (fully stretched), $\\det J$ must be ZERO.',
          },
          {
            id: 'b',
            latex: '\\det J = L_1 L_2 \\sin(\\theta_1 + \\theta_2)',
            correct: false,
            misconception:
              'Base rotation $\\theta_1$ merely spins the entire rigid arm in the plane and CANNOT create or destroy a singularity — $\\theta_1$ must cancel out completely!',
          },
          {
            id: 'c',
            latex: '\\det J = L_1 L_2 \\sin\\theta_2',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\det J = (L_1 + L_2) \\sin\\theta_2',
            correct: false,
            misconception:
              'Check the units! Each column of $J$ has units of meters ($\\text{m}$), so $\\det J$ must scale as area ($\\text{m}^2$, i.e., $L_1 L_2$).',
          },
        ],
        lockedLabel: 'Jacobian Determinant',
        lockedResultLatex: '\\det J(\\theta) = \\textcolor{#34D399}{L_1 L_2 \\sin\\theta_2} \\quad (\\text{independent of } \\theta_1)',
        hint: 'Notice the $-L_2^2 s_{12} c_{12}$ and $+L_2^2 s_{12} c_{12}$ terms cancel identically, leaving $L_1 L_2(s_{12}c_1 - c_{12}s_1)$.',
      },
      {
        stepType: 'jac_singularities',
        badge: 'Locate Exact 2R Singularity Configurations',
        whyThisStep:
          'At configurations where $\\det J(\\theta) = 0$, the Jacobian drops rank and becomes non-invertible — commanding Cartesian speed along the lost direction demands infinite joint velocity!',
        systemImpact:
          'At $\\theta_2 = 0$ (fully stretched outer boundary $r = L_1+L_2$) and $\\theta_2 = \\pi$ (fully folded inner boundary $r = |L_1-L_2|$), both links are collinear, collapsing radial velocity authority to zero.',
        prompt:
          'Solve $\\det J(\\theta) = L_1 L_2 \\sin\\theta_2 = 0$ to identify all kinematic singularities of the 2R planar arm and their physical meaning.',
        highlightLatex:
          '\\det J(\\theta) = L_1 L_2 \\sin\\theta_2 = \\textcolor{#F59E0B}{0} \\;\\implies\\; \\operatorname{rank}(J) = 1 < 2',
        options: [
          {
            id: 'a',
            latex: '\\theta_2 = \\pm 90^\\circ \\text{ (links orthogonal, arm locks in the tangential direction)}',
            correct: false,
            misconception:
              'At $\\theta_2 = \\pm 90^\\circ$, $|\\sin\\theta_2| = 1$ (MAXIMAL determinant!) — orthogonal links give the arm its BEST agility, never a singularity!',
          },
          {
            id: 'b',
            latex: '\\theta_2 = 0 \\text{ (outer boundary, stretched) and } \\theta_2 = \\pi \\text{ (inner boundary, folded)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\theta_1 = 0 \\text{ and } \\theta_1 = \\pi \\text{ regardless of } \\theta_2',
            correct: false,
            misconception:
              'Because $\\det J = L_1 L_2 \\sin\\theta_2$ is completely independent of $\\theta_1$, base yaw alone never causes a singularity.',
          },
          {
            id: 'd',
            latex: '\\theta_1 + \\theta_2 = 0 \\text{ whenever the forearm points along } +x',
            correct: false,
            misconception:
              'Singularity occurs when link 2 is collinear with LINK 1 ($\\theta_2 = 0$ or $\\pi$), not when link 2 happens to align with the global $x$-axis!',
          },
        ],
        lockedLabel: '2R Singularities',
        lockedResultLatex: '\\textcolor{#34D399}{\\theta_2 = 0 \\text{ (outer boundary)},\\quad \\theta_2 = \\pi \\text{ (inner folded)}}',
        hint: 'Where does $\\sin\\theta_2$ equal zero in $[0, 2\\pi)$? Picture the arm physically at those two elbow angles.',
      },
      {
        stepType: 'yoshikawa_manipulability',
        badge: 'Maximize Yoshikawa Manipulability w = |det J|',
        whyThisStep:
          'Workcell designers place assembly fixtures right inside the robot’s "sweet spot" — the posture band where the velocity ellipsoid has maximum area and lowest sensitivity to joint noise.',
        systemImpact:
          'Maximizing $w(\\theta) = \\sqrt{\\det(J J^T)} = |\\det J| = L_1 L_2|\\sin\\theta_2|$ at $\\theta_2 = \\pm 90^\\circ$ puts the forearm perpendicular to the upper arm, delivering peak directional dexterity across the workspace.',
        prompt:
          'Which elbow angle(s) $\\theta_2$ maximize the Yoshikawa manipulability measure $w(\\theta) = \\sqrt{\\det(J J^T)} = |\\det J|$ for the 2R planar arm?',
        highlightLatex:
          'w(\\theta) = \\sqrt{\\det(J J^T)} = \\textcolor{#22D3EE}{L_1 L_2 |\\sin\\theta_2|} \\;\\longrightarrow\\; \\max_{\\theta_2} w(\\theta)',
        options: [
          {
            id: 'a',
            latex: '\\theta_2 = 0^\\circ \\quad (\\text{maximum lever arm } L_1 + L_2)',
            correct: false,
            misconception:
              'At $\\theta_2 = 0^\\circ$, $w = 0$! Tangential speed is high, but the velocity ellipsoid collapses to a flat line with zero radial area.',
          },
          {
            id: 'b',
            latex: '\\theta_2 = \\pm 45^\\circ \\quad (w = \\tfrac{\\sqrt{2}}{2} L_1 L_2)',
            correct: false,
            misconception:
              '$|\\sin(\\pm 45^\\circ)| = 0.707 < 1$ — you can still gain $41\\%$ more manipulability volume by bending to $90^\\circ$.',
          },
          {
            id: 'c',
            latex: '\\theta_2 = \\pm 90^\\circ \\quad (w_{\\max} = L_1 L_2,\\; \\text{peak ellipsoid area})',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\theta_2 = 180^\\circ \\quad (\\text{minimum inertia near base})',
            correct: false,
            misconception:
              'At $\\theta_2 = 180^\\circ$, the arm is folded completely flat on itself ($\\sin 180^\\circ = 0$), which is the inner workspace singularity!',
          },
        ],
        lockedLabel: 'Peak Manipulability',
        lockedResultLatex: '\\textcolor{#34D399}{\\theta_2 = \\pm 90^\\circ \\implies w_{\\max} = L_1 L_2}',
        hint: 'Find where $|\\sin\\theta_2|$ attains its global maximum of $1$.',
      },
      {
        stepType: 'static_force_duality',
        badge: 'Compute Static Joint Torques via τ = Jᵀ F',
        whyThisStep:
          'By the Principle of Virtual Work ($\\tau^T \\delta\\theta = F^T \\delta x = F^T J \\delta\\theta$), the exact SAME Jacobian transpose maps desired end-effector contact force $F$ straight into motor torque commands $\\tau$ — with ZERO matrix inversion!',
        systemImpact:
          'Evaluating $\\tau = J^T F = \\begin{bmatrix}-1 & 2 \\\\ -1 & 0\\end{bmatrix} \\begin{bmatrix}0 \\\\ -10\\end{bmatrix} = [-20,\\; 0]^T\\text{ N}\\!\\cdot\\!\\text{m}$ proves that force-controlled impedance arms can safely push right through singularities because $J^T$ never blows up!',
        prompt:
          'For $L_1 = 2\\text{ m},\\; L_2 = 1\\text{ m}$ at $\\theta_1 = 0^\\circ,\\; \\theta_2 = 90^\\circ$, compute the static joint torques $\\tau = J^T F$ required for the arm to exert a tip force $F = [0,\\; -10]^T\\text{ N}$ on a workpiece.',
        highlightLatex:
          'J(0^\\circ, 90^\\circ) = \\begin{bmatrix} -1 & -1 \\\\ 2 & 0 \\end{bmatrix}, \\qquad \\tau = \\textcolor{#22D3EE}{J^T} \\textcolor{#F59E0B}{\\begin{bmatrix} 0 \\\\ -10 \\end{bmatrix}}',
        options: [
          {
            id: 'a',
            latex: '\\tau = \\begin{bmatrix} +10 \\\\ 0 \\end{bmatrix}\\text{ N}\\!\\cdot\\!\\text{m}',
            correct: false,
            misconception:
              'You multiplied $J F$ instead of $J^T F$! Force duality strictly uses the TRANSPOSE $J^T$ (from $\\tau^T\\dot{\\theta} = F^T J\\dot{\\theta}$).',
          },
          {
            id: 'b',
            latex: '\\tau = \\begin{bmatrix} -20 \\\\ -10 \\end{bmatrix}\\text{ N}\\!\\cdot\\!\\text{m}',
            correct: false,
            misconception:
              'Check row 2 of $J^T = \\begin{bmatrix}-1 & 2 \\\\ -1 & 0\\end{bmatrix}$: $(-1)(0) + (0)(-10) = 0$, NOT $-10$!',
          },
          {
            id: 'c',
            latex: '\\tau = \\begin{bmatrix} +20 \\\\ 0 \\end{bmatrix}\\text{ N}\\!\\cdot\\!\\text{m}',
            correct: false,
            misconception:
              'Sign check! Pushing DOWNWARD ($F_y = -10\\text{ N}$) at $x = +2\\text{ m}$ requires a CLOCKWISE (negative) torque $\\tau_1 = (2)(-10) = -20\\text{ N}\\!\\cdot\\!\\text{m}$ at joint 1.',
          },
          {
            id: 'd',
            latex: '\\tau = \\begin{bmatrix} -20 \\\\ 0 \\end{bmatrix}\\text{ N}\\!\\cdot\\!\\text{m}',
            correct: true,
          },
        ],
        lockedLabel: 'Static Joint Torques',
        lockedResultLatex: '\\tau = J^T F = \\textcolor{#34D399}{\\begin{bmatrix} -20 \\\\ 0 \\end{bmatrix}\\text{ N}\\!\\cdot\\!\\text{m}}',
        hint: 'Transpose $J$ first to get $J^T = \\begin{bmatrix}-1 & 2 \\\\ -1 & 0\\end{bmatrix}$, then multiply by $[0, -10]^T$.',
      },
      {
        stepType: 'torque_geometric_insight',
        badge: 'Interpret τ₂ = 0 Geometrically (Zero Moment Arm)',
        whyThisStep:
          'A sharp mechatronics engineer never trusts a matrix output until it matches free-body physical intuition — verifying $\\tau_2 = 0$ confirms your sign and transpose conventions instantly.',
        systemImpact:
          'At $(0^\\circ, 90^\\circ)$, link 2 stands vertically from $(2,0)$ to $(2,1)$, so the vertical force $F = [0, -10]^T$ acts straight down link 2’s spine directly through joint 2 — zero moment arm means link 2’s bearings carry pure axial compression while motor 2 draws zero current!',
        prompt:
          'Physically, why does elbow motor 2 require ZERO torque ($\\tau_2 = 0\\text{ N}\\!\\cdot\\!\\text{m}$) while pushing downward with $F = [0, -10]^T\\text{ N}$ at $\\theta_1 = 0^\\circ, \\theta_2 = 90^\\circ$?',
        highlightLatex:
          'p_{\\text{joint }2} = (2, 0), \\quad p_{\\text{tip}} = (2, 1), \\quad F = [0, -10]^T \\;\\implies\\; r_2 \\times F = \\textcolor{#34D399}{0}',
        options: [
          {
            id: 'a',
            latex: '\\text{The arm is at a kinematic singularity so joint 2 is mechanically locked}',
            correct: false,
            misconception:
              'At $\\theta_2 = 90^\\circ$, the arm is at MAXIMUM manipulability ($\\det J = L_1 L_2 = 2$), the exact opposite of a singularity!',
          },
          {
            id: 'b',
            latex: '\\text{The vertical line of action of } F \\text{ passes straight through joint 2 (zero moment arm; link 2 takes axial load)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Joint 1 absorbs all static forces in every 2R posture so } \\tau_2 \\text{ is always zero}',
            correct: false,
            misconception:
              'If $F$ were horizontal ($F = [-10, 0]^T$), then $\\tau_2 = (-1)(-10) = +10\\text{ N}\\!\\cdot\\!\\text{m} \\neq 0$ because the force would act with a $1\\text{ m}$ moment arm about joint 2!',
          },
          {
            id: 'd',
            latex: '\\text{Because } L_2 = 1 \\text{ cancels out the } 10\\text{ N force inside } J^T',
            correct: false,
            misconception:
              'The zero comes from geometry ($\\cos 90^\\circ = 0$, parallel force & link vector), not from the magnitude of $L_2 = 1$.',
          },
        ],
        lockedLabel: 'Physical Force Insight',
        lockedResultLatex: '\\textcolor{#34D399}{F \\parallel \\text{Link }2 \\implies \\text{line of action hits Joint 2} \\implies \\tau_2 = 0}',
        hint: 'Draw link 1 from $(0,0)$ to $(2,0)$ and link 2 from $(2,0)$ to $(2,1)$, then draw a downward arrow at $(2,1)$ — what is its lever arm about $(2,0)$?',
      },
    ],
  },

  {
    id: 'kin3-space-jacobian-adjoint',
    tier: 'jacobians',
    tierLabel: 'Jacobians & Singularities',
    title: '6D Space Jacobian J_s(θ) via Screw Adjoints & 6-DOF Wrist Singularity',
    mechatronicsContext:
      'Taking symbolic partial derivatives of a 6-DOF or 7-DOF spatial arm is tedious and error-prone. Screw theory assembles the ENTIRE 6×n Space Jacobian in closed form by simply transforming each home screw Sᵢ with the Adjoint map — and exposes the notorious spherical-wrist singularity on sight.',
    expressionLatex:
      '\\mathcal{V}_s = J_s(\\theta)\\dot{\\theta},\\; J_{si} = \\operatorname{Ad}_{T_{i-1}}\\mathcal{S}_i',
    finalAnswerLatex:
      'J_{si}=\\operatorname{Ad}_{e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_{i-1}]\\theta_{i-1}}}(\\mathcal{S}_i),\\; \\theta_5=0\\implies\\operatorname{rank}(J_s)=5',
    diagram: {
      type: 'ik-solver-arch',
      variant: 'jacobian-ellipsoid',
      metric: 'J_si = Ad(T)·Sᵢ',
      law: 'V_s = J_s(θ) θ̇',
      badge: 'SVD σ_min(J)',
      subtitle: '6D Space Jacobian & Wrist Singularity',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.0],
      setpoint: 0.15,
      setpointLabel: 'SVD Warning Threshold σ_min = 0.15',
      primaryLabel: 'Wrist σ_min(J) = |sin θ₅(t)|',
      baselineLabel: 'Condition Risk 0.15 / max(σ_min, 0.08)',
      primaryFn: (t) => Math.abs(Math.sin(1.5708 * (1 - t))),
      baselineFn: (t) => 0.15 / Math.max(0.08, Math.abs(Math.sin(1.5708 * (1 - t)))),
      tsMarker: { t: 1.0, label: 'Wrist Singularity θ₅ = 0', band: 0.03 },
      defaultCursor: 0.5,
      subtitle:
        'Hover across $t \\in [0, 2]\\text{ s}$ as wrist pitch $\\theta_5(t)$ crosses straight through $0^\\circ$ at $t = 1.0\\text{ s}$: the smallest SVD singular value $\\sigma_{\\min}(J)$ drops cleanly to $0$ (Emerald) while inverse conditioning $\\kappa$ spikes violently (Cyan dashed), triggering real-time DLS damping.',
      domainMeta: '6-DOF Spherical Wrist Crossing · θ₅ → 0 · SVD σ_min(J) & Conditioning',
      metrics: [
        { label: 'Space Column i', value: 'Ad(T₁···Tᵢ₋₁) · Sᵢ' },
        { label: 'Wrist Singularity', value: 'θ₅ = 0 (z₄ ∥ z₆)' },
        { label: 'Nullspace Spin', value: 'θ̇₄ = −θ̇₆ (Zero EE!)' },
        { label: 'SOTA Monitor', value: 'SVD σ_min & κ(J) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'space_jac_formula',
        badge: 'Write the 6D Space Jacobian via Adjoint Maps',
        whyThisStep:
          'Differentiating the Space PoE product $\\dot{T} T^{-1} = [\\mathcal{V}_s]$ yields every column of $J_s(\\theta) \\in \\mathbb{R}^{6\\times n}$ directly from the transforms you ALREADY computed during forward kinematics!',
        systemImpact:
          'Setting $J_{s1} = \\mathcal{S}_1$ and $J_{si} = \\operatorname{Ad}_{e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_{i-1}]\\theta_{i-1}}}(\\mathcal{S}_i)$ lets Pinocchio/MuJoCo build exact 6D spatial Jacobians in $O(n)$ time with zero finite-difference noise.',
        prompt:
          'For Space PoE $T(\\theta) = e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_n]\\theta_n} M$, select the exact formula for column $i$ ($i \\ge 2$) of the $6\\times n$ Space Jacobian $J_s(\\theta)$ in $\\mathcal{V}_s = J_s(\\theta)\\dot{\\theta}$.',
        highlightLatex:
          '[\\mathcal{V}_s] = \\dot{T} T^{-1} = \\sum_{i=1}^{n} \\dot{\\theta}_i \\,\\textcolor{#22D3EE}{T_{i-1}}[\\mathcal{S}_i]\\textcolor{#22D3EE}{T_{i-1}^{-1}}',
        options: [
          {
            id: 'a',
            latex: 'J_{si}(\\theta) = \\operatorname{Ad}_{e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_{i-1}]\\theta_{i-1}}}(\\mathcal{S}_i)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'J_{si}(\\theta) = \\operatorname{Ad}_{e^{[\\mathcal{S}_{i+1}]\\theta_{i+1}}\\cdots e^{[\\mathcal{S}_n]\\theta_n}}(\\mathcal{S}_i)',
            correct: false,
            misconception:
              'Distal joints $i+1, \\dots, n$ are DOWNSTREAM of joint $i$ and cannot move joint $i$’s physical axis in space! (Distal exponentials appear in the BODY Jacobian $J_b$, with negative angles.)',
          },
          {
            id: 'c',
            latex: 'J_{si}(\\theta) = \\operatorname{Ad}_{M}(\\mathcal{S}_i) \\quad \\text{(constant for all } \\theta\\text{)}',
            correct: false,
            misconception:
              'The Jacobian is configuration-dependent! As proximal joints $1, \\dots, i-1$ rotate, joint $i$’s physical axis sweeps through space — and notice $M$ cancels completely out of $\\dot{T}T^{-1}$!',
          },
          {
            id: 'd',
            latex: 'J_{si}(\\theta) = \\operatorname{Ad}_{e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_{i-1}]\\theta_{i-1}}}^T (\\mathcal{S}_i)',
            correct: false,
            misconception:
              'Transpose $\\operatorname{Ad}^T$ transforms wrenches, NOT velocity twists/screws — column $i$ of $J_s$ is a spatial twist transformed by $\\operatorname{Ad}$ directly.',
          },
        ],
        lockedLabel: '6D Space Jacobian',
        lockedResultLatex: 'J_{s1}=\\mathcal{S}_1,\\quad J_{si} = \\textcolor{#34D399}{\\operatorname{Ad}_{e^{[\\mathcal{S}_1]\\theta_1}\\cdots e^{[\\mathcal{S}_{i-1}]\\theta_{i-1}}}(\\mathcal{S}_i)}',
        hint: 'Match $[J_{si}] = T_{i-1}[\\mathcal{S}_i]T_{i-1}^{-1}$ against the Adjoint definition $[\\operatorname{Ad}_T \\mathcal{V}] = T[\\mathcal{V}]T^{-1}$.',
      },
      {
        stepType: 'space_jac_meaning',
        badge: 'Interpret Column J_si Physically in Base {s}',
        whyThisStep:
          'When you can "see" every column of $J_s(\\theta)$ in 3D space without doing algebra, you can spot singularities on a physical robot in two seconds flat.',
        systemImpact:
          'Column $J_{si}(\\theta)$ is literally the **current spatial unit screw axis** of joint $i$ expressed in fixed base `{s}` at the robot’s live posture $\\theta$ — meaning $\\operatorname{rank}(J_s)$ drops whenever two or more joint screw axes become linearly dependent!',
        prompt:
          'What is the exact physical meaning of column $i$, $J_{si}(\\theta) \\in \\mathbb{R}^6$, of the Space Jacobian?',
        highlightLatex:
          '\\mathcal{V}_s = \\textcolor{#22D3EE}{J_{s1}(\\theta)}\\dot{\\theta}_1 + \\cdots + \\textcolor{#F59E0B}{J_{si}(\\theta)}\\dot{\\theta}_i + \\cdots + J_{sn}(\\theta)\\dot{\\theta}_n',
        options: [
          {
            id: 'a',
            latex: '\\text{The home-pose screw axis } \\mathcal{S}_i \\text{ frozen at } \\theta = 0',
            correct: false,
            misconception:
              'Only $J_{s1} = \\mathcal{S}_1$ stays frozen! All other columns $J_{si}(\\theta)$ update live as upstream joints move joint $i$’s axis.',
          },
          {
            id: 'b',
            latex: '\\text{The current 6D spatial unit screw axis of joint } i \\text{ expressed in fixed base } \\{s\\} \\text{ at live posture } \\theta',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{The Cartesian position } p_i \\text{ and Euler angles of link } i\\text{’s center of mass}',
            correct: false,
            misconception:
              'Jacobian columns are instantaneous velocity twists $(\\omega_i, v_i)$ in $\\mathfrak{se}(3)$, never static link poses or Euler angles.',
          },
          {
            id: 'd',
            latex: '\\text{The static torque } \\tau_i \\text{ needed to hold link } i \\text{ against gravity}',
            correct: false,
            misconception:
              'Torques come from $J^T \\mathcal{F}$ (dual mapping), whereas each column of $J_s$ is the spatial velocity twist produced by unit speed $\\dot{\\theta}_i = 1$.',
          },
        ],
        lockedLabel: 'Column Physical Meaning',
        lockedResultLatex: '\\textcolor{#34D399}{J_{si}(\\theta) = \\text{live spatial unit screw axis of joint } i \\text{ in base } \\{s\\}}',
        hint: 'Set $\\dot{\\theta}_i = 1$ and all other joint speeds to $0$ in $\\mathcal{V}_s = J_s(\\theta)\\dot{\\theta}$ — what motion does the end-effector execute?',
      },
      {
        stepType: 'wrist_singularity_diag',
        badge: 'Diagnose the 6-DOF Spherical Wrist Singularity (θ₅ = 0)',
        whyThisStep:
          'The spherical-wrist singularity is the #1 runtime surprise on 6-DOF industrial arms (UR, FANUC, KUKA, ABB) during straight-line Cartesian welding or spraying passes.',
        systemImpact:
          'At $\\theta_5 = 0$, wrist axes $\\hat{z}_4$ and $\\hat{z}_6$ align collinearly through the same wrist center $p_{wc}$ — making screw columns $J_{s4}$ and $J_{s6}$ identical ($J_{s4} = J_{s6}$) and collapsing $\\operatorname{rank}(J_s)$ from $6$ to $5$!',
        prompt:
          'On a 6-DOF articulated arm with a ZYZ spherical wrist (joints 4, 5, 6 intersecting at wrist center $p_{wc}$), what happens algebraically to $J_s(\\theta)$ when $\\theta_5 = 0$?',
        highlightLatex:
          '\\theta_5 = 0 \\;\\implies\\; \\hat{z}_4 \\parallel \\hat{z}_6 \\text{ through same } p_{wc} \\;\\implies\\; \\textcolor{#F59E0B}{J_{s4} \\text{ vs. } J_{s6}}',
        options: [
          {
            id: 'a',
            latex: '\\text{All 6 columns become zero vectors so the entire robot freezes}',
            correct: false,
            misconception:
              'Each joint still has a unit screw axis ($\\|\\omega_i\\|=1$), so NO column vanishes — instead, two distinct columns become linearly dependent!',
          },
          {
            id: 'b',
            latex: '\\text{Columns } J_{s1} \\text{ and } J_{s2} \\text{ become dependent while the wrist retains full 3-DOF rotation}',
            correct: false,
            misconception:
              'Setting $\\theta_5 = 0$ aligns the WRIST axes $\\hat{z}_4$ and $\\hat{z}_6$, leaving base/shoulder joints 1 and 2 unaffected.',
          },
          {
            id: 'c',
            latex: '\\text{Wrist axes } \\hat{z}_4 \\text{ and } \\hat{z}_6 \\text{ become collinear through } p_{wc} \\implies J_{s4} = J_{s6},\\; \\operatorname{rank}(J_s) = 5 < 6',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{The wrist center } p_{wc} \\text{ leaves the reachable workspace annulus}',
            correct: false,
            misconception:
              'A wrist singularity is an INTERIOR singularity! It can occur right in the dead center of the reachable workspace whenever the tool points straight out along link 4.',
          },
        ],
        lockedLabel: 'Wrist Singularity',
        lockedResultLatex: '\\theta_5 = 0 \\implies \\textcolor{#34D399}{\\hat{z}_4 \\parallel \\hat{z}_6 \\implies J_{s4} = J_{s6},\\; \\operatorname{rank}(J_s) = 5}',
        hint: 'Two revolute joints with identical unit axis $\\omega$ passing through the exact same point $p_{wc}$ have identical screws $(\\omega, -\\omega \\times p_{wc})$!',
      },
      {
        stepType: 'wrist_nullspace_spin',
        badge: 'Predict Physical Effect: Lost DOF + Internal Nullspace Spin',
        whyThisStep:
          'By the Rank-Nullity Theorem ($\\operatorname{rank}(J) + \\dim\\ker(J) = n$), losing 1 Cartesian DOF on a 6-DOF arm simultaneously spawns a 1D internal nullspace — creating the infamous "180° wrist flip" on factory floors.',
        systemImpact:
          'At $\\theta_5 = 0$, the robot cannot rotate instantaneously about the axis perpendicular to both $\\hat{z}_4$ and $\\hat{z}_5$, yet spinning $\\dot{\\theta}_4 = -\\dot{\\theta}_6$ twirls the wrist housing wildly with ZERO motion of the tool tip!',
        prompt:
          'What exact dual physical phenomenon occurs on the 6-DOF arm right at the spherical wrist singularity $\\theta_5 = 0$?',
        highlightLatex:
          '\\operatorname{rank}(J_s) = 5 \\;\\Longleftrightarrow\\; \\dim(\\ker J_s) = 6 - 5 = \\textcolor{#F59E0B}{1}',
        options: [
          {
            id: 'a',
            latex: '\\text{Loses 1 translational DOF in } z \\text{ while gaining unlimited payload capacity}',
            correct: false,
            misconception:
              'The regional arm (joints 1–3) still provides all 3 translational DOFs of $p_{wc}$; the lost DOF at $\\theta_5 = 0$ is purely ROTATIONAL.',
          },
          {
            id: 'b',
            latex: '\\text{Loses 1 Cartesian rotational DOF (infinite speed to cross) while gaining 1D nullspace spin } \\dot{\\theta}_4 = -\\dot{\\theta}_6',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Gains an extra 7th Cartesian DOF because joints 4 and 6 act together}',
            correct: false,
            misconception:
              'Collinear joints do the exact SAME motion, so they become redundant in one axis and LEAVE a perpendicular rotational direction unactuated — losing a DOF, never gaining one!',
          },
          {
            id: 'd',
            latex: '\\text{Joint 5 locks permanently and cannot move until the arm returns to } \\theta = 0',
            correct: false,
            misconception:
              'Joint 5 itself can freely pitch away from $\\theta_5 = 0$ to exit the singularity immediately; only instantaneous EE rotation orthogonal to both $\\hat{z}_4$ and $\\hat{z}_5$ is instantaneously unavailable.',
          },
        ],
        lockedLabel: 'Lost DOF & Nullspace',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Lose 1 rot DOF} \\;+\\; \\text{Gain 1D nullspace } (\\dot{\\theta}_4 = -\\dot{\\theta}_6,\\; \\mathcal{V}_s = 0)}',
        hint: 'Check what $J_{s4}\\dot{\\theta}_4 + J_{s6}\\dot{\\theta}_6$ equals when $J_{s4} = J_{s6}$ and $\\dot{\\theta}_4 = -\\dot{\\theta}_6$!',
      },
      {
        stepType: 'svd_vs_det_monitor',
        badge: 'Monitor SVD σ_min(J) & Condition Number κ Instead of det(J)',
        whyThisStep:
          'Students rely on $\\det(J)$, but real production robot controllers (MoveIt, Pinocchio, Franka FCI, KUKA FRI) almost NEVER check $\\det(J)$ in a real-time loop.',
        systemImpact:
          'Computing the SVD $J = U \\Sigma V^T$ works seamlessly on non-square redundant arms ($6\\times 7$), scales cleanly with unit weighting, and directly exposes the worst collapsing direction via $\\sigma_{\\min}(J) \\to 0$ and $\\kappa(J) = \\sigma_{\\max}/\\sigma_{\\min} \\to \\infty$.',
        prompt:
          'Why do production robotics controllers monitor the SVD smallest singular value $\\sigma_{\\min}(J)$ and condition number $\\kappa = \\sigma_{\\max}/\\sigma_{\\min}$ instead of $\\det(J)$?',
        highlightLatex:
          'J = U \\Sigma V^T \\in \\mathbb{R}^{6\\times n}, \\qquad \\textcolor{#34D399}{\\sigma_{\\min}(J) \\to 0}, \\qquad \\textcolor{#F59E0B}{\\kappa(J) = \\frac{\\sigma_{\\max}}{\\sigma_{\\min}}}',
        options: [
          {
            id: 'a',
            latex: '\\text{Because } \\det(J) \\text{ is slower to compute than a full } 6\\times 7 \\text{ SVD}',
            correct: false,
            misconception:
              'A $6\\times 6$ determinant is actually cheaper than SVD — we choose SVD for geometric reliability and generality, not raw FLOP count!',
          },
          {
            id: 'b',
            latex: '\\text{Because } \\det(J) \\text{ is always positive and can never equal zero at singularities}',
            correct: false,
            misconception:
              '$\\det(J)$ CAN be positive, negative, or zero (and does vanish at exact square singularities), but its magnitude is misleading near singularities.',
          },
          {
            id: 'c',
            latex: '\\text{Because } \\det(J) \\text{ requires } J \\text{ to be square, hides extreme anisotropy } (\\sigma_{\\max}\\cdot\\sigma_{\\min}), \\text{ and cannot pinpoint the singular direction}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Because } \\sigma_{\\min}(J) \\text{ automatically turns a singular arm into a non-singular arm}',
            correct: false,
            misconception:
              'SVD diagnoses singularities cleanly (and guides damped least squares), but it does not physically alter the robot’s mechanics.',
          },
        ],
        lockedLabel: 'SVD Monitoring Standard',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{SVD works for } 6\\times 7 \\text{ arms, flags } \\sigma_{\\min}\\to 0 \\text{ \\& } \\kappa=\\sigma_{\\max}/\\sigma_{\\min}}',
        hint: 'What happens to $\\det(J) = \\sigma_1\\sigma_2$ if $\\sigma_1 = 100$ and $\\sigma_2 = 0.01$? And what happens to $\\det(J)$ on a 7-DOF Franka Panda ($6\\times 7$)?',
      },
    ],
  },

  // =========================================================================
  // TIER 4: CLOSED-FORM ANALYTICAL INVERSE KINEMATICS (2 problems)
  // =========================================================================
  {
    id: 'kin4-ik-2r-geometric',
    tier: 'analytical-ik',
    tierLabel: 'Analytical IK',
    title: 'Closed-Form Geometric IK: Workspace Annulus & Elbow-Up / Elbow-Down Branches',
    mechatronicsContext:
      'Forward kinematics maps joints to a single unique pose, whereas Inverse Kinematics is nonlinear, can have ZERO solutions outside the workspace, and typically yields MULTIPLE distinct branches inside it. Solving the exact 2R geometric IK builds the muscle memory behind every closed-form industrial solver.',
    expressionLatex:
      'L_1=3,\\; L_2=2,\\; (x,y)=(3,2) \\;\\longrightarrow\\; (\\theta_1, \\theta_2)',
    finalAnswerLatex:
      '\\theta_2 = \\pm 90^\\circ;\\quad \\text{Down: }(0^\\circ, +90^\\circ),\\quad \\text{Up: }(67.38^\\circ, -90^\\circ)',
    diagram: {
      type: 'robot-chain',
      variant: '2r-dh',
      links: 'L₁=3, L₂=2',
      joints: 'Target (3, 2)',
      convention: 'Closed-Form IK',
      subtitle: '2R Arm — Dual IK Branches',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.0],
      setpoint: 3.6056,
      setpointLabel: 'Target Radius r = √13 ≈ 3.61',
      primaryLabel: 'Elbow-Down Reach r(t) → (3, 2)',
      baselineLabel: 'Elbow-Up Reach r(t) → (3, 2)',
      primaryFn: (t) => {
        const th2 = (Math.PI / 2) * (1 - Math.exp(-2.4 * t));
        return Math.sqrt(9 + 4 + 12 * Math.cos(th2));
      },
      baselineFn: (t) => {
        const th2 = (-Math.PI / 2) * (1 - Math.exp(-1.7 * t));
        return Math.sqrt(9 + 4 + 12 * Math.cos(th2));
      },
      tsMarker: { t: 1.6, label: 'Both Hit r = √13', band: 0.08 },
      defaultCursor: 0.58,
      subtitle:
        'Hover across time $t \\in [0, 2]\\text{ s}$ as both the Elbow-Down branch $(0^\\circ, +90^\\circ)$ (Emerald) and Elbow-Up branch $(67.38^\\circ, -90^\\circ)$ (Cyan dashed) converge from stretched posture ($r=5$) onto the EXACT same target radius $r = \\sqrt{13} \\approx 3.61$ at $(3, 2)$!',
      domainMeta: '2R Closed-Form IK · Annulus [1, 5] · Dual Branches Hit (3, 2)',
      metrics: [
        { label: 'Workspace Annulus', value: 'r ∈ [1, 5] (r=√13 ✓)' },
        { label: 'Law of Cosines', value: 'cos θ₂ = 0 (Exact!)' },
        { label: 'Elbow-Down', value: '(θ₁, θ₂) = (0°, +90°)' },
        { label: 'Elbow-Up', value: '(67.38°, −90°) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'ik_workspace_check',
        badge: 'Verify Target Inside Workspace Annulus',
        whyThisStep:
          'Before computing inverse trig functions, always test reachability first — passing $|\\cos\\theta_2| > 1$ into $\\sqrt{1 - c_2^2}$ crashes unguarded IK firmware with `NaN`!',
        systemImpact:
          'With $r = \\sqrt{3^2+2^2} = \\sqrt{13} \\approx 3.61$ lying strictly inside $[|L_1-L_2|,\\; L_1+L_2] = [1,\\; 5]$, the target sits cleanly inside the nonsingular interior annulus and guarantees TWO distinct real IK solutions.',
        prompt:
          'For $L_1 = 3,\\; L_2 = 2$ and target $(x, y) = (3, 2)$, compute target radius $r = \\sqrt{x^2+y^2}$ and verify whether it lies inside the 2R reachable workspace annulus.',
        highlightLatex:
          '|L_1 - L_2| \\le \\textcolor{#F59E0B}{r = \\sqrt{x^2+y^2}} \\le L_1 + L_2, \\qquad L_1=3,\\; L_2=2',
        options: [
          {
            id: 'a',
            latex: 'r = \\sqrt{13} \\approx 3.61 \\in [1,\\; 5] \\implies \\text{Strictly reachable (2 interior branches)}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'r = 5 \\in [0,\\; 5] \\implies \\text{Boundary singularity (unique solution)}',
            correct: false,
            misconception:
              'Watch the Euclidean norm! $\\sqrt{3^2 + 2^2} = \\sqrt{13} \\approx 3.61$, NOT $3 + 2 = 5$, and the inner hole has radius $|3 - 2| = 1$, not $0$.',
          },
          {
            id: 'c',
            latex: 'r = \\sqrt{13} \\approx 3.61 \\notin [2,\\; 3] \\implies \\text{Unreachable target}',
            correct: false,
            misconception:
              'The outer workspace radius is the SUM $L_1 + L_2 = 5$ and inner radius is $|L_1 - L_2| = 1$, not the individual link lengths $[2, 3]$!',
          },
          {
            id: 'd',
            latex: 'r = \\sqrt{5} \\approx 2.24 \\in [1,\\; 5] \\implies \\text{Reachable}',
            correct: false,
            misconception:
              'Square the coordinates before adding: $x^2 + y^2 = 3^2 + 2^2 = 9 + 4 = 13$, not $3 + 2 = 5$.',
          },
        ],
        lockedLabel: 'Workspace Check',
        lockedResultLatex: '\\textcolor{#34D399}{r = \\sqrt{13} \\approx 3.61 \\in [1,\\; 5] \\;\\text{(Interior Reachable ✓)}}',
        hint: 'Compute $r = \\sqrt{3^2 + 2^2}$ and compare against $[|L_1-L_2|,\\; L_1+L_2]$.',
      },
      {
        stepType: 'ik_law_of_cosines',
        badge: 'Apply Law of Cosines for cos θ₂',
        whyThisStep:
          'Squaring and summing $x^2 + y^2$ eliminates $\\theta_1$ completely, isolating elbow angle $\\theta_2$ inside one algebraic equation.',
        systemImpact:
          'Evaluating $\\cos\\theta_2 = \\frac{13 - 9 - 4}{2(3)(2)} = 0$ immediately reveals a right-angled triangle ($3^2 + 2^2 = (\\sqrt{13})^2$), placing the arm right at peak Yoshikawa manipulability!',
        prompt:
          'Use the Law of Cosines $x^2 + y^2 = L_1^2 + L_2^2 + 2 L_1 L_2 \\cos\\theta_2$ to solve for $c_2 = \\cos\\theta_2$ at $(x, y) = (3, 2)$ with $L_1 = 3,\\; L_2 = 2$.',
        highlightLatex:
          '\\cos\\theta_2 = \\frac{\\textcolor{#F59E0B}{x^2 + y^2} - L_1^2 - L_2^2}{2 L_1 L_2}',
        options: [
          {
            id: 'a',
            latex: '\\cos\\theta_2 = \\frac{13 - 9 - 4}{12} = 0',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\cos\\theta_2 = \\frac{9 + 4 - 13}{6} = 0 \\text{ (from } r^2 = L_1^2 + L_2^2 - 2L_1 L_2 c_2\\text{)}',
            correct: false,
            misconception:
              'Careful! For the EXTERIOR relative joint angle $\\theta_2$ (zero when stretched straight), the sign is $+2 L_1 L_2 \\cos\\theta_2$ (since internal triangle angle is $\\pi - \\theta_2$), AND the denominator is $2 L_1 L_2 = 12$, not $6$!',
          },
          {
            id: 'c',
            latex: '\\cos\\theta_2 = \\frac{5 - 3 - 2}{12} = 0',
            correct: false,
            misconception:
              'Never drop the squares in the Law of Cosines! Although $(5-3-2)$ coincidentally gives $0$ here, failing to square $x, y, L_1, L_2$ fails for every other target.',
          },
          {
            id: 'd',
            latex: '\\cos\\theta_2 = \\frac{13 + 9 + 4}{12} = \\frac{26}{12}',
            correct: false,
            misconception:
              'First, $|\\cos\\theta_2|$ can NEVER exceed $1$! Subtract $L_1^2 + L_2^2$ from $r^2$ when isolating $2 L_1 L_2 \\cos\\theta_2$.',
          },
        ],
        lockedLabel: 'Elbow Cosine c₂',
        lockedResultLatex: '\\cos\\theta_2 = \\textcolor{#34D399}{\\frac{13 - 9 - 4}{12} = 0}',
        hint: 'Notice $x^2 + y^2 = 13$ and $L_1^2 + L_2^2 = 9 + 4 = 13$!',
      },
      {
        stepType: 'ik_two_branches',
        badge: 'Extract BOTH Elbow Branches with atan2',
        whyThisStep:
          'Never call bare `acos(c2)` in production IK code — it silently throws away the negative-angle branch AND suffers terrible floating-point sensitivity near $\\theta_2 = 0, \\pi$.',
        systemImpact:
          'Using $\\theta_2 = \\operatorname{atan2}(\\pm\\sqrt{1-c_2^2},\\; c_2)$ cleanly recovers BOTH valid branches: $\\theta_2 = +90^\\circ$ (elbow-down) and $\\theta_2 = -90^\\circ$ (elbow-up) with full four-quadrant numerical precision.',
        prompt:
          'With $c_2 = \\cos\\theta_2 = 0$, compute BOTH valid elbow angles using $\\theta_2 = \\operatorname{atan2}(\\pm\\sqrt{1 - c_2^2},\\; c_2)$.',
        highlightLatex:
          's_2 = \\pm\\sqrt{1 - c_2^2} = \\textcolor{#F59E0B}{\\pm 1}, \\qquad \\theta_2 = \\operatorname{atan2}(s_2,\\; c_2)',
        options: [
          {
            id: 'a',
            latex: '\\theta_2 = +90^\\circ \\text{ only (since } \\arccos(0) = +90^\\circ\\text{)}',
            correct: false,
            misconception:
              'Bare $\\arccos$ only returns $[0, \\pi]$ and discards the equally valid elbow-up mirror branch $\\theta_2 = -90^\\circ$!',
          },
          {
            id: 'b',
            latex: '\\theta_2 = 0^\\circ \\text{ and } \\theta_2 = 180^\\circ',
            correct: false,
            misconception:
              'At $0^\\circ$ and $180^\\circ$, $\\cos\\theta_2 = \\pm 1$ and $\\sin\\theta_2 = 0$ — you swapped the arguments of $\\operatorname{atan2}(y, x)$!',
          },
          {
            id: 'c',
            latex: '\\theta_2 = +90^\\circ \\text{ (elbow-down) and } \\theta_2 = -90^\\circ \\text{ (elbow-up)}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\theta_2 = +45^\\circ \\text{ and } \\theta_2 = -45^\\circ',
            correct: false,
            misconception:
              'At $\\pm 45^\\circ$, $\\cos\\theta_2 = \\frac{\\sqrt{2}}{2} \\neq 0$; $\\operatorname{atan2}(\\pm 1, 0) = \\pm 90^\\circ$.',
          },
        ],
        lockedLabel: 'Dual Elbow Branches',
        lockedResultLatex: '\\theta_2 = \\textcolor{#34D399}{+90^\\circ \\text{ (elbow-down)}, \\quad -90^\\circ \\text{ (elbow-up)}}',
        hint: 'Evaluate $\\operatorname{atan2}(+1, 0)$ and $\\operatorname{atan2}(-1, 0)$ in degrees.',
      },
      {
        stepType: 'ik_solve_theta1',
        badge: 'Solve Shoulder Angle θ₁ for Elbow-Down Branch',
        whyThisStep:
          'Once $\\theta_2$ is known, the triangle angle $\\psi = \\operatorname{atan2}(L_2 s_2,\\; L_1 + L_2 c_2)$ between link 1 and the target ray $(x,y)$ immediately unlocks $\\theta_1$ without quadrant ambiguity.',
        systemImpact:
          'Substituting $\\theta_2 = +90^\\circ$ yields $\\theta_1 = \\operatorname{atan2}(2,3) - \\operatorname{atan2}(2,3) = 0^\\circ$ — closing the exact round-trip loop back to Problem 1’s FK test $(3, 2)$!',
        prompt:
          'Compute shoulder angle $\\theta_1 = \\operatorname{atan2}(y, x) - \\operatorname{atan2}(L_2 s_2,\\; L_1 + L_2 c_2)$ for the elbow-down branch $\\theta_2 = +90^\\circ$ ($L_1=3,\\; L_2=2,\\; x=3,\\; y=2$).',
        highlightLatex:
          '\\theta_1 = \\operatorname{atan2}(\\textcolor{#F59E0B}{2},\\; \\textcolor{#F59E0B}{3}) - \\operatorname{atan2}(\\textcolor{#22D3EE}{L_2 s_2},\\; \\textcolor{#22D3EE}{L_1 + L_2 c_2})',
        options: [
          {
            id: 'a',
            latex: '\\theta_1 = \\operatorname{atan2}(2, 3) + \\operatorname{atan2}(2, 3) \\approx 67.38^\\circ',
            correct: false,
            misconception:
              'That is the shoulder angle for the ELBOW-UP branch ($\\theta_2 = -90^\\circ$, where $L_2 s_2 = -2$)! For $\\theta_2 = +90^\\circ$, you SUBTRACT $\\operatorname{atan2}(+2, 3)$.',
          },
          {
            id: 'b',
            latex: '\\theta_1 = \\operatorname{atan2}(2, 3) - \\operatorname{atan2}(2, 3) = 0^\\circ',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\theta_1 = \\operatorname{atan2}(3, 2) - \\operatorname{atan2}(2, 3) \\approx 22.62^\\circ',
            correct: false,
            misconception:
              'Watch the argument order of $\\operatorname{atan2}(y, x)$: $y = 2$ goes FIRST and $x = 3$ goes SECOND!',
          },
          {
            id: 'd',
            latex: '\\theta_1 = \\operatorname{atan2}(2, 3) = 33.69^\\circ',
            correct: false,
            misconception:
              '$\\operatorname{atan2}(y, x)$ is the angle to the target point, NOT link 1’s angle — link 1 must sit BELOW the target ray when the elbow bends upward by $+90^\\circ$.',
          },
        ],
        lockedLabel: 'Elbow-Down Solution',
        lockedResultLatex: '\\textcolor{#34D399}{\\theta_1 = 0^\\circ,\\quad \\theta_2 = +90^\\circ} \\;\\implies\\; \\text{FK} = (3, 2)\\;\\checkmark',
        hint: 'Plug $s_2 = 1, c_2 = 0$ into $L_2 s_2 = 2$ and $L_1 + L_2 c_2 = 3$ — look at the two $\\operatorname{atan2}$ terms!',
      },
      {
        stepType: 'ik_branch_selection',
        badge: 'Choose Between Elbow-Up & Elbow-Down in Production Cells',
        whyThisStep:
          'Returning two valid IK branches is only half the job — picking the WRONG branch in a live factory cell can swing the elbow violently through a fixture or smash a joint hard stop!',
        systemImpact:
          'Production controllers filter feasible branches against joint limits and collision models, then minimize weighted joint-space travel $\\|q - q_{\\text{curr}}\\|_W$ so the arm transitions smoothly without sudden posture flips.',
        prompt:
          'When an analytical IK solver returns multiple valid branches (e.g., elbow-up vs. elbow-down), how does a production robotics controller pick the optimal branch?',
        highlightLatex:
          'q^* = \\arg\\min_{q \\in \\mathcal{Q}_{\\text{valid}}} \\; \\textcolor{#34D399}{\\|q - q_{\\text{curr}}\\|_W} \\quad \\text{s.t. collision-free \\& inside limits}',
        options: [
          {
            id: 'a',
            latex: '\\text{Always pick the branch with } \\theta_2 > 0 \\text{ regardless of the current robot posture}',
            correct: false,
            misconception:
              'Hard-coding $\\theta_2 > 0$ fails if a fixture sits below the target or if the arm is currently in elbow-up mode (causing a violent mid-path flip).',
          },
          {
            id: 'b',
            latex: '\\text{Average the elbow-up and elbow-down angles: } q^* = \\tfrac{1}{2}(q_{\\text{up}} + q_{\\text{down}})',
            correct: false,
            misconception:
              'NEVER average two nonlinear IK branches! The average of $(0^\\circ, +90^\\circ)$ and $(67.38^\\circ, -90^\\circ)$ is $(33.69^\\circ, 0^\\circ)$, which stretches the arm straight to $r = 5$ and misses $(3,2)$ completely!',
          },
          {
            id: 'c',
            latex: '\\text{Pick the branch with the largest } |\\theta_1| \\text{ to maximize motor torque}',
            correct: false,
            misconception:
              'Larger joint angle $|\\theta_1|$ wastes cycle time and has no inherent torque benefit.',
          },
          {
            id: 'd',
            latex: '\\text{Filter by joint limits \\& obstacle clearance, then minimize weighted joint travel } \\|q - q_{\\text{curr}}\\|_W',
            correct: true,
          },
        ],
        lockedLabel: 'Branch Selection Rule',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Collision-free \\& within joint stops} \\;+\\; \\min\\|q - q_{\\text{curr}}\\|_W}',
        hint: 'In real-time continuous motion, which criteria prevent sudden arm flips, collisions, and mechanical limit hits?',
      },
    ],
  },

  {
    id: 'kin4-pieper-decoupling',
    tier: 'analytical-ik',
    tierLabel: 'Analytical IK',
    title: '6-DOF Industrial Arm IK: Pieper Decoupling & Up to 8 Closed-Form Solutions',
    mechatronicsContext:
      'A general 6R spatial arm has coupled 16th-degree polynomial IK requiring numerical root-finding. Yet almost every industrial 6-DOF arm (PUMA, FANUC, ABB, KUKA) obeys Pieper’s geometric trick — letting closed-form IK decouple cleanly into two tiny 3-DOF problems solved in microseconds.',
    expressionLatex:
      'p_{wc} = p_e - d_6 R_e \\hat{z}, \\quad R_6^3 = (R_3^0)^T R_e',
    finalAnswerLatex:
      'p_{wc} = p_e - d_6 R_e\\hat{z},\\; R_6^3 = (R_3^0)^T R_e \\implies 4 \\times 2 = 8 \\text{ IK solutions}',
    diagram: {
      type: 'robot-chain',
      variant: 'pieper-6dof',
      links: 'Regional + Wrist',
      joints: 'p_wc = p_e − d₆ z_e',
      convention: 'Pieper 6-DOF',
      subtitle: '6-DOF Spherical Wrist Kinematic Decoupling',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 2.0],
      setpoint: 0.0,
      setpointLabel: 'Zero Pose Residual (Closed-Form)',
      primaryLabel: 'Pieper / IKFast Solve Residual (mm)',
      baselineLabel: 'Iterative Gradient IK Residual (mm)',
      primaryFn: () => 0.0,
      baselineFn: (t) => 12.0 * Math.exp(-2.1 * t),
      defaultCursor: 0.45,
      subtitle:
        'Hover across time $t$: Pieper closed-form decoupling (`IKFast`) solves all up-to-8 exact branches algebraically to machine precision in microseconds with zero residual (Emerald), whereas iterative numerical solvers decay asymptotically over iterations (Cyan dashed).',
      domainMeta: '6-DOF Pieper Decoupling · 3-DOF Position + 3-DOF Wrist · 8 Branches',
      metrics: [
        { label: 'Pieper Condition', value: '3 Axes Meet at p_wc' },
        { label: 'Wrist Center', value: 'p_e − d₆ R_e ẑ' },
        { label: 'Regional × Wrist', value: '4 × 2 = 8 Solutions' },
        { label: 'SOTA Compiler', value: 'IKFast / Paden-Kahan ✓' },
      ],
    },
    steps: [
      {
        stepType: 'pieper_condition',
        badge: 'Identify Pieper’s Sufficient Condition',
        whyThisStep:
          'Mechanical engineers intentionally design 6-DOF industrial robots to satisfy Pieper’s criterion at the CAD stage so factory motion planners get exact closed-form IK instead of slow local-minima optimizers.',
        systemImpact:
          'When three consecutive revolute axes (typically wrist joints 4, 5, 6) intersect at a single spherical **Wrist Center** $p_{wc}$, moving joints 4–6 rotates the tool purely around $p_{wc}$ without translating $p_{wc}$ at all!',
        prompt:
          'What geometric design condition (**Pieper’s Sufficient Condition**) guarantees a closed-form analytical IK solution for a 6-DOF revolute robot arm?',
        highlightLatex:
          '\\text{6-DOF Coupled IK} \\;\\xrightarrow{\\;\\textcolor{#34D399}{\\text{Pieper Condition}}\\;}\\; \\text{3-DOF Position} \\;+\\; \\text{3-DOF Orientation}',
        options: [
          {
            id: 'a',
            latex: '\\text{All six joint axes must be mutually parallel in a single plane}',
            correct: false,
            misconception:
              'Six parallel axes can only move in 2D planar space (3 Cartesian DOFs), never full 6D spatial pose!',
          },
          {
            id: 'b',
            latex: '\\text{Three consecutive revolute axes (typically joints 4, 5, 6) intersect at a single spherical Wrist Center } p_{wc}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{All link lengths } L_1 = L_2 = \\dots = L_6 \\text{ must be identical}',
            correct: false,
            misconception:
              'Equal link lengths neither simplify nor decouple 6-DOF IK; the decoupling comes strictly from three consecutive intersecting axes (or three parallel axes).',
          },
          {
            id: 'd',
            latex: '\\text{The robot must have at least three prismatic joints}',
            correct: false,
            misconception:
              'Most industrial 6-DOF arms (PUMA, FANUC, KUKA, ABB) are all-revolute (6R) and still achieve closed-form IK via a spherical wrist!',
          },
        ],
        lockedLabel: 'Pieper’s Condition',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{3 consecutive revolute axes intersect at spherical Wrist Center } p_{wc}}',
        hint: 'What mechanical property lets joints 4, 5, 6 spin the gripper freely while keeping one special point fixed in 3D space?',
      },
      {
        stepType: 'pieper_wrist_center',
        badge: 'Compute Exact Wrist Center Coordinates p_wc',
        whyThisStep:
          'Given the desired tool pose $(p_e, R_e)$, backing off along the tool’s approach axis $\\hat{z}_e$ by flange length $d_6$ reveals the exact 3D target point $p_{wc}$ that joints 1, 2, 3 must hit.',
        systemImpact:
          'Because $p_{wc} = p_e - d_6 R_e \\hat{z}$ depends ONLY on the desired pose $(p_e, R_e)$ and known tool offset $d_6$, joints $(\\theta_4, \\theta_5, \\theta_6)$ drop out of the position equations completely!',
        prompt:
          'Given desired end-effector pose $(p_e, R_e) \\in SE(3)$ and tool flange offset $d_6$ from the wrist center along the EE approach axis $\\hat{z}_e = R_e \\hat{z}$, compute the Wrist Center $p_{wc}$.',
        highlightLatex:
          'p_e = \\textcolor{#22D3EE}{p_{wc}} + d_6 \\textcolor{#F59E0B}{\\hat{z}_e}, \\qquad \\hat{z}_e = R_e \\begin{bmatrix}0\\\\0\\\\1\\end{bmatrix}',
        options: [
          {
            id: 'a',
            latex: 'p_{wc} = p_e + d_6 R_e \\hat{z}',
            correct: false,
            misconception:
              'Adding $+d_6 R_e \\hat{z}$ steps FORWARD past the gripper tip instead of stepping BACKWARD from the tip to the wrist center!',
          },
          {
            id: 'b',
            latex: 'p_{wc} = p_e - d_6 \\hat{z}',
            correct: false,
            misconception:
              'Missing $R_e$! Subtracting $d_6 \\hat{z}$ steps vertically down along the BASE $z_0$-axis instead of stepping backward along the rotated TOOL axis $R_e \\hat{z}$!',
          },
          {
            id: 'c',
            latex: 'p_{wc} = p_e - d_6 R_e \\hat{z}',
            correct: true,
          },
          {
            id: 'd',
            latex: 'p_{wc} = R_e^T p_e - d_6 \\hat{z}',
            correct: false,
            misconception:
              'Rotating $p_e$ by $R_e^T$ transforms the wrist center into the TOOL frame rather than expressing $p_{wc}$ in the fixed BASE frame `{0}` needed by joints 1–3!',
          },
        ],
        lockedLabel: 'Wrist Center p_wc',
        lockedResultLatex: 'p_{wc} = \\textcolor{#34D399}{p_e - d_6 R_e \\hat{z}}',
        hint: 'Solve $p_e = p_{wc} + d_6 (R_e \\hat{z})$ directly for $p_{wc}$ in the base frame.',
      },
      {
        stepType: 'pieper_regional_ik',
        badge: 'Solve 3-DOF Regional Arm (Up to 4 Postures)',
        whyThisStep:
          'Once $p_{wc} = [x_{wc}, y_{wc}, z_{wc}]^T$ is fixed, solving $(\\theta_1, \\theta_2, \\theta_3)$ reduces directly to the 3R spatial arm geometry (base yaw + 2R planar IK in the vertical plane).',
        systemImpact:
          'Combining 2 shoulder configurations (lefty/righty: $\\theta_1$ vs. $\\theta_1 + \\pi$ reaching backward) with 2 elbow configurations (elbow-up vs. elbow-down) gives up to **4** distinct regional solutions $(\\theta_1, \\theta_2, \\theta_3)$ for the exact same $p_{wc}$.',
        prompt:
          'How many distinct closed-form regional posture combinations $(\\theta_1, \\theta_2, \\theta_3)$ can place a generic reachable wrist center $p_{wc}$ on an articulated 3R regional arm?',
        highlightLatex:
          'p_{wc} = [x_{wc},\\; y_{wc},\\; z_{wc}]^T \\;\\longrightarrow\\; \\textcolor{#F59E0B}{(\\theta_1,\\; \\theta_2,\\; \\theta_3)}',
        options: [
          {
            id: 'a',
            latex: '\\text{Up to 2 postures (elbow-up / elbow-down only, since } \\theta_1 \\text{ is unique)}',
            correct: false,
            misconception:
              'Don’t forget the flipped waist! Base joint 1 can also spin $180^\\circ$ ($\\theta_1 \\to \\theta_1 + \\pi$) and reach OVER its own shoulder backward — doubling 2 into 4!',
          },
          {
            id: 'b',
            latex: '\\text{Up to 4 postures (2 shoulder left/right} \\times \\text{2 elbow up/down)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Up to 6 postures (one per joint of the 6-DOF arm)}',
            correct: false,
            misconception:
              'The number of discrete IK branches is multiplicative across quadratic trig choices ($2\\times 2 = 4$), not equal to the DOF count.',
          },
          {
            id: 'd',
            latex: '\\text{Infinitely many postures (1D nullspace)}',
            correct: false,
            misconception:
              'Only a redundant arm ($n > 3$ for 3D position) has infinitely many regional solutions; a 3R arm solving 3D $p_{wc}$ has discrete branches (except when $p_{wc}$ sits right on the vertical $z_0$ overhead singularity).',
          },
        ],
        lockedLabel: 'Regional Postures',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Up to 4 regional solutions } (2\\text{ shoulder} \\times 2\\text{ elbow})}',
        hint: 'Count the choices for waist orientation (facing forward vs. flipped backward) times the 2R elbow choices.',
      },
      {
        stepType: 'pieper_wrist_orientation',
        badge: 'Isolate Wrist Matrix R₆³ & Solve ZYZ Angles',
        whyThisStep:
          'For each regional branch $(\\theta_1, \\theta_2, \\theta_3)$, the forearm rotation $R_3^0$ is completely known — leaving the wrist joints $(\\theta_4, \\theta_5, \\theta_6)$ to supply ONLY the remaining relative orientation.',
        systemImpact:
          'Using orthogonality $(R_3^0)^{-1} = (R_3^0)^T$ isolates $R_6^3 = (R_3^0)^T R_e$ instantly without matrix inversion, and extracting ZYZ Euler wrist angles $(\\theta_4, \\theta_5, \\theta_6)$ yields **2** wrist-flip branches ($+\\theta_5$ vs. $-\\theta_5$ with $\\theta_4, \\theta_6$ shifted by $\\pi$).',
        prompt:
          'From $R_3^0(\\theta_1,\\theta_2,\\theta_3)\\, R_6^3(\\theta_4,\\theta_5,\\theta_6) = R_e$, isolate the wrist orientation matrix $R_6^3$ and state how many ZYZ wrist-flip solutions it yields (away from $\\theta_5 = 0$).',
        highlightLatex:
          '\\textcolor{#22D3EE}{R_3^0(\\theta_1,\\theta_2,\\theta_3)} \\cdot \\textcolor{#F59E0B}{R_6^3(\\theta_4,\\theta_5,\\theta_6)} = R_e \\in SO(3)',
        options: [
          {
            id: 'a',
            latex: 'R_6^3 = R_e (R_3^0)^T \\implies \\text{2 wrist-flip solutions}',
            correct: false,
            misconception:
              'Rotation matrices do NOT commute! To cancel $R_3^0$ on the LEFT of $R_6^3$, you must LEFT-multiply both sides by $(R_3^0)^T$: $R_6^3 = (R_3^0)^T R_e$.',
          },
          {
            id: 'b',
            latex: 'R_6^3 = (R_3^0)^T R_e \\implies \\text{1 unique wrist solution}',
            correct: false,
            misconception:
              'Just like the 2R elbow, extracting $\\theta_5 = \\operatorname{atan2}(\\pm\\sqrt{1 - r_{33}^2},\\; r_{33})$ produces TWO valid wrist-flip branches ($\\pm\\theta_5$)!',
          },
          {
            id: 'c',
            latex: 'R_6^3 = (R_3^0)^T R_e \\implies \\text{2 wrist-flip solutions } (\\pm\\theta_5)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'R_6^3 = R_e - R_3^0 \\implies \\text{4 wrist solutions}',
            correct: false,
            misconception:
              'Rotations live in the multiplicative group $SO(3)$ — subtracting two rotation matrices NEVER produces a valid rotation!',
          },
        ],
        lockedLabel: 'Wrist Orientation R₆³',
        lockedResultLatex: 'R_6^3 = \\textcolor{#34D399}{(R_3^0)^T R_e \\implies 2\\text{ wrist-flip branches } (\\pm\\theta_5)}',
        hint: 'Left-multiply $R_3^0 R_6^3 = R_e$ by $(R_3^0)^{-1} = (R_3^0)^T$, and recall how many $\\pm$ roots ZYZ Euler extraction has.',
      },
      {
        stepType: 'pieper_8_branches_ikfast',
        badge: 'Count All 8 Branches & Connect to Paden-Kahan / IKFast',
        whyThisStep:
          'Knowing the exact branch count and the modern symbolic tools that automate closed-form IK lets you deploy microsecond multi-branch solvers on real industrial cells.',
        systemImpact:
          'Multiplying $4$ regional postures $\\times\\; 2$ wrist flips yields up to **8** closed-form 6-DOF IK solutions — which modern pipelines derive cleanly via geometric **Paden-Kahan screw subproblems** or auto-compile into C++ using **IKFast**.',
        prompt:
          'How many total closed-form IK solutions can a Pieper 6-DOF industrial arm have for a generic reachable 6D pose, and what modern methods automate this derivation?',
        highlightLatex:
          '\\text{Total Branches} = (\\textcolor{#22D3EE}{4 \\text{ regional}}) \\times (\\textcolor{#F59E0B}{2 \\text{ wrist-flip}}) = \\textcolor{#34D399}{?}',
        options: [
          {
            id: 'a',
            latex: '6 \\text{ solutions; automated via Euler-Lagrange dynamics}',
            correct: false,
            misconception:
              'Branches multiply ($4 \\times 2 = 8$, not $4 + 2 = 6$), and Euler-Lagrange derives equations of motion (dynamics), not inverse kinematics.',
          },
          {
            id: 'b',
            latex: '16 \\text{ solutions; solved exclusively by neural networks}',
            correct: false,
            misconception:
              'A general non-Pieper 6R arm can have up to 16 complex/real roots, whereas a Pieper spherical-wrist arm has at most $4 \\times 2 = 8$ exact algebraic solutions.',
          },
          {
            id: 'c',
            latex: '2 \\text{ solutions (elbow-up / elbow-down only); solved by Rodrigues’ formula alone}',
            correct: false,
            misconception:
              '2 branches only accounts for the elbow; multiplying shoulder left/right (2) $\\times$ elbow up/down (2) $\\times$ wrist flip (2) yields 8!',
          },
          {
            id: 'd',
            latex: '8 \\text{ solutions } (4\\times 2)\\text{; generalized by Paden-Kahan screw subproblems \\& auto-compiled by IKFast}',
            correct: true,
          },
        ],
        lockedLabel: '8 Branches & IKFast',
        lockedResultLatex: '\\textcolor{#34D399}{4 \\times 2 = 8 \\text{ closed-form IK solutions (Paden-Kahan / IKFast)}}',
        hint: 'Every one of the 4 regional postures pairs with 2 wrist-flip orientations ($4 \\times 2$).',
      },
    ],
  },

  // =========================================================================
  // TIER 5: MODERN SOTA NUMERICAL IK — DLS, REDUNDANT NULLSPACE & QP-IK (2 problems)
  // =========================================================================
  {
    id: 'kin5-dls-nullspace',
    tier: 'sota-ik',
    tierLabel: 'SOTA: DLS & QP-IK',
    title: 'Numerical IK Through Singularities: Damped Least Squares & Redundant Nullspace',
    mechatronicsContext:
      '7-DOF cobots (Franka Panda, KUKA iiwa) and non-Pieper humanoids have no simple 8-branch formula — they rely on differential numerical IK. Mastering Damped Least Squares (DLS) and Nullspace Projection stops motors from exploding near singularities while letting redundant elbows dodge obstacles in real time.',
    expressionLatex:
      '\\dot{q} = J^T(JJ^T+\\lambda^2 I)^{-1}v + (I - J^+ J)\\dot{q}_0',
    finalAnswerLatex:
      '\\Delta\\theta = J^T(JJ^T+\\lambda^2 I)^{-1}e,\\; \\frac{0.01}{0.01^2+0.1^2}\\approx 0.99,\\; N = I - J^+ J',
    diagram: {
      type: 'ik-solver-arch',
      variant: 'dls-nullspace',
      metric: 'Jᵀ(JJᵀ+λ²I)⁻¹',
      law: 'q̇ = J⁺v + (I−J⁺J)q̇₀',
      badge: 'DLS + Nullspace',
      subtitle: 'Damped Least Squares & Nullspace Projector',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0.01, 1.0],
      setpoint: 5.0,
      setpointLabel: 'Max Safe Gain = 1/(2λ) = 5.0',
      primaryLabel: 'DLS Gain σ/(σ²+λ²) (λ = 0.1)',
      baselineLabel: 'Undamped J⁺ Gain 1/σ (Clipped at 20)',
      primaryFn: (t) => t / (t * t + 0.01),
      baselineFn: (t) => Math.min(20, 1 / Math.max(0.01, t)),
      tsMarker: { t: 0.1, label: 'Peak DLS at σ = λ', band: 0.15 },
      defaultCursor: 0.14,
      subtitle:
        'Hover across $t = \\sigma \\in [0.01, 1.0]$ (singular value approaching $0$): undamped pseudoinverse gain $1/\\sigma$ explodes to $100\\times$ at $\\sigma=0.01$ (Cyan dashed), while Damped Least Squares $\\sigma/(\\sigma^2+\\lambda^2)$ with $\\lambda=0.1$ smoothly caps at $1/(2\\lambda)=5$ and drops to $0.99$ at $\\sigma=0.01$ (Emerald)!',
      domainMeta: 'Singularity Damping · DLS σ/(σ²+λ²) vs Undamped 1/σ · λ = 0.1',
      metrics: [
        { label: 'Undamped σ=0.01', value: '1/σ = 100× (Blowup!)' },
        { label: 'DLS (λ = 0.1)', value: '0.990× (101× Safer!)' },
        { label: 'Nullspace N', value: 'I − J⁺J (J·N = 0)' },
        { label: 'Limit Gap', value: 'Needs Hard QP-IK ✓' },
      ],
    },
    steps: [
      {
        stepType: 'pinv_divergence',
        badge: 'Expose Why Pseudoinverse J⁺ Explodes Near Singularities',
        whyThisStep:
          'Differential IK $\\Delta\\theta = J^+ e$ looks effortless in MATLAB until your physical arm brushes near a singularity and trips every servo over-current fault simultaneously.',
        systemImpact:
          'Expanding $J^+ = \\sum_i \\frac{1}{\\sigma_i} v_i u_i^T$ proves that any nonzero error component along the singular direction $u_{\\min}$ gets amplified by $1/\\sigma_{\\min} \\to \\infty$, violently commanding infinite joint velocity!',
        prompt:
          'Using the SVD $J = \\sum_i \\sigma_i u_i v_i^T$, write the Moore-Penrose pseudoinverse step $\\Delta\\theta = J^+ e$ and diagnose why it fails catastrophically as $\\sigma_{\\min}(J) \\to 0$.',
        highlightLatex:
          'J^+ = \\sum_{i=1}^{m} \\textcolor{#F59E0B}{\\frac{1}{\\sigma_i}}\\, v_i u_i^T, \\qquad \\Delta\\theta = J^+ e',
        options: [
          {
            id: 'a',
            latex: '\\text{As } \\sigma_{\\min}\\to 0,\\; \\|\\Delta\\theta\\| \\to 0 \\text{ so the robot smoothly halts before the singularity}',
            correct: false,
            misconception:
              'Exact opposite! Because $J^+$ DIVIDES by $\\sigma_{\\min}$, shrinking $\\sigma_{\\min} \\to 0$ drives $1/\\sigma_{\\min} \\to \\infty$, commanding violent velocity spikes instead of halting!',
          },
          {
            id: 'b',
            latex: '\\text{As } \\sigma_{\\min}\\to 0,\\; 1/\\sigma_{\\min} \\to \\infty \\implies \\|\\Delta\\theta\\| \\text{ explodes for tiny errors along } u_{\\min}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{As } \\sigma_{\\min}\\to 0,\\; J^+ \\text{ becomes an orthogonal matrix so joint speeds double}',
            correct: false,
            misconception:
              'An orthogonal matrix has all singular values equal to $1$; near a singularity, $J^+$ is massively ill-conditioned with singular value $1/\\sigma_{\\min} \\gg 1$.',
          },
          {
            id: 'd',
            latex: '\\text{Only 7-DOF redundant arms diverge; 6-DOF arms stay bounded under } J^{-1}e',
            correct: false,
            misconception:
              'A 6-DOF arm’s exact inverse $J^{-1} = \\sum \\frac{1}{\\sigma_i} v_i u_i^T$ diverges identically when $\\sigma_{\\min} \\to 0$!',
          },
        ],
        lockedLabel: 'Pseudoinverse Blowup',
        lockedResultLatex: '\\sigma_{\\min} \\to 0 \\implies \\textcolor{#34D399}{\\frac{1}{\\sigma_{\\min}} \\to \\infty \\;(\\|\\Delta\\theta\\| \\text{ explodes!})}',
        hint: 'Look at the coefficient $1/\\sigma_i$ inside $J^+ e = \\sum_i \\frac{u_i^T e}{\\sigma_i} v_i$ when $\\sigma_{\\min} = 10^{-4}$.',
      },
      {
        stepType: 'dls_derivation',
        badge: 'Derive Damped Least Squares (DLS / Levenberg-Marquardt)',
        whyThisStep:
          'Adding a quadratic Tikhonov penalty $\\lambda^2 \\|\\Delta\\theta\\|^2$ trades a microscopic tracking residual near singularities for guaranteed bounded joint velocities everywhere in the workspace.',
        systemImpact:
          'Minimizing $\\|J\\Delta\\theta - e\\|^2 + \\lambda^2 \\|\\Delta\\theta\\|^2$ gives $(J^T J + \\lambda^2 I)\\Delta\\theta = J^T e$, which by the matrix push-through identity becomes the compact $m\\times m$ DLS law $\\Delta\\theta = J^T(J J^T + \\lambda^2 I)^{-1} e$!',
        prompt:
          'Set the gradient of the DLS objective $L(\\Delta\\theta) = \\|J\\Delta\\theta - e\\|^2 + \\lambda^2 \\|\\Delta\\theta\\|^2$ to zero and select the exact Damped Least Squares update.',
        highlightLatex:
          '\\min_{\\Delta\\theta} \\Big( \\|\\textcolor{#22D3EE}{J}\\Delta\\theta - e\\|^2 + \\textcolor{#F59E0B}{\\lambda^2} \\|\\Delta\\theta\\|^2 \\Big)',
        options: [
          {
            id: 'a',
            latex: '\\Delta\\theta = J^T (J J^T - \\lambda^2 I)^{-1} e',
            correct: false,
            misconception:
              'Sign trap! Subtracting $-\\lambda^2 I$ makes $(JJ^T - \\lambda^2 I)$ SINGULAR whenever $\\sigma_i = \\lambda$! Regularization MUST ADD $+\\lambda^2 I$ so the matrix stays strictly positive definite.',
          },
          {
            id: 'b',
            latex: '\\Delta\\theta = (J J^T + \\lambda^2 I)^{-1} J e',
            correct: false,
            misconception:
              'Dimension mismatch! $J \\in \\mathbb{R}^{m\\times n}$ cannot multiply $e \\in \\mathbb{R}^m$ on the right — you need $J^T$ to map task error $e \\in \\mathbb{R}^m$ back into joint space $\\mathbb{R}^n$!',
          },
          {
            id: 'c',
            latex: '\\Delta\\theta = J^T (J J^T + \\lambda^2 I)^{-1} e',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\Delta\\theta = (J^T + \\lambda^2 I)^{-1} e',
            correct: false,
            misconception:
              'You cannot add an identity matrix to a rectangular $n\\times m$ matrix $J^T$; the normal equations always form the symmetric positive-definite Gram matrix $J J^T + \\lambda^2 I$ (or $J^T J + \\lambda^2 I$).',
          },
        ],
        lockedLabel: 'DLS Update Law',
        lockedResultLatex: '\\Delta\\theta = \\textcolor{#34D399}{J^T (J J^T + \\lambda^2 I)^{-1} e}',
        hint: 'From $(J^T J + \\lambda^2 I)\\Delta\\theta = J^T e$, use the identity $(J^T J + \\lambda^2 I)^{-1} J^T = J^T (J J^T + \\lambda^2 I)^{-1}$.',
      },
      {
        stepType: 'dls_gain_number',
        badge: 'Compute Exact Damped Singular Gain at σ = 0.01, λ = 0.1',
        whyThisStep:
          'Plugging real numbers into the SVD filter factor $\\frac{\\sigma}{\\sigma^2 + \\lambda^2}$ reveals how dramatically a small damping constant $\\lambda = 0.1$ tames a $100\\times$ singularity spike.',
        systemImpact:
          'At $\\sigma = 0.01$ with $\\lambda = 0.1$, DLS cuts the singular gain from $1/0.01 = 100$ down to $\\frac{0.01}{0.0001 + 0.01} \\approx 0.990$ (a $101\\times$ suppression!) while leaving well-conditioned directions ($\\sigma = 1.0$) nearly untouched ($0.990$ vs $1.000$)!',
        prompt:
          'For a near-singular direction with $\\sigma = 0.01$ and damping $\\lambda = 0.1$, compute the exact DLS singular gain $g_{\\text{DLS}} = \\frac{\\sigma}{\\sigma^2 + \\lambda^2}$ and compare against undamped $1/\\sigma$.',
        highlightLatex:
          'J_{\\text{DLS}}^+ = \\sum_i \\textcolor{#34D399}{\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}} v_i u_i^T, \\qquad \\sigma=\\textcolor{#22D3EE}{0.01},\\; \\lambda=\\textcolor{#F59E0B}{0.1}',
        options: [
          {
            id: 'a',
            latex: 'g_{\\text{DLS}} = \\frac{0.01}{0.01^2 + 0.1^2} = \\frac{0.01}{0.0101} \\approx 0.990 \\quad (\\text{vs. undamped } 100\\times)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'g_{\\text{DLS}} = \\frac{0.01}{0.01 + 0.1} \\approx 0.091 \\quad (\\text{vs. undamped } 100\\times)',
            correct: false,
            misconception:
              'Don’t forget to SQUARE both $\\sigma$ and $\\lambda$ in the denominator! $0.01^2 + 0.1^2 = 0.0001 + 0.01 = 0.0101$, NOT $0.11$.',
          },
          {
            id: 'c',
            latex: 'g_{\\text{DLS}} = \\frac{1}{0.01 + 0.1^2} = 50.0 \\quad (\\text{vs. undamped } 100\\times)',
            correct: false,
            misconception:
              'The numerator is $\\sigma$ (from $J^T$), NOT $1$, and the first denominator term is $\\sigma^2$ (from $JJ^T$), NOT $\\sigma$!',
          },
          {
            id: 'd',
            latex: 'g_{\\text{DLS}} = \\frac{0.1}{0.01^2 + 0.1^2} \\approx 9.90 \\quad (\\text{vs. undamped } 100\\times)',
            correct: false,
            misconception:
              'The numerator is $\\sigma = 0.01$, not $\\lambda = 0.1$ — so as $\\sigma \\to 0$, DLS cleanly drives the singular gain to $0$ instead of diverging!',
          },
        ],
        lockedLabel: 'Damped Gain Verified',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{\\sigma}{\\sigma^2+\\lambda^2} = \\frac{0.01}{0.0101} \\approx 0.990} \\;(\\text{down from } 100\\times!)',
        hint: 'Compute $\\sigma^2 = 0.0001$ and $\\lambda^2 = 0.01$, add them to get $0.0101$, then divide $\\sigma = 0.01$ by $0.0101$.',
      },
      {
        stepType: 'nullspace_projector',
        badge: 'Construct Redundant Nullspace Projector N = I − J⁺J',
        whyThisStep:
          'A 7-DOF cobot (Franka Panda / KUKA iiwa) has 1 extra degree of freedom beyond 6D Cartesian pose — the Nullspace Projector unlocks that extra DOF to move the elbow WITHOUT disturbing the end-effector by a single micron!',
        systemImpact:
          'Because $J(I - J^+ J)\\dot{q}_0 = (J - J J^+ J)\\dot{q}_0 = (J - J)\\dot{q}_0 = 0$, the projector $N = I - J^+ J$ cleanly decouples secondary posture goals $\\dot{q}_0$ from primary Cartesian tracking $v$.',
        prompt:
          'For a redundant robot ($n > m$) with velocity law $\\dot{q} = J^+ v + N \\dot{q}_0$, select the orthogonal Nullspace Projector $N \\in \\mathbb{R}^{n\\times n}$ and verify $J N \\dot{q}_0 = 0$.',
        highlightLatex:
          '\\dot{q} = J^+ v + \\textcolor{#22D3EE}{N}\\,\\dot{q}_0 \\;\\implies\\; J\\dot{q} = v + (\\textcolor{#34D399}{J N})\\dot{q}_0 \\stackrel{!}{=} v',
        options: [
          {
            id: 'a',
            latex: 'N = I - J J^+ \\implies J N = J - J^2 J^+ = 0',
            correct: false,
            misconception:
              'Dimension error! $J J^+ \\in \\mathbb{R}^{m\\times m}$ lives in TASK space ($6\\times 6$), whereas $\\dot{q}_0 \\in \\mathbb{R}^n$ lives in JOINT space ($7\\times 7$) — you need $I_n - J^+ J$!',
          },
          {
            id: 'b',
            latex: 'N = J^+ J \\implies J N \\dot{q}_0 = 0',
            correct: false,
            misconception:
              '$J^+ J$ projects ONTO the row space (range of $J^T$), giving $J(J^+ J)\\dot{q}_0 = J\\dot{q}_0 \\neq 0$ — that directly disturbs the end-effector!',
          },
          {
            id: 'c',
            latex: 'N = I_n - J^+ J \\implies J(I_n - J^+ J)\\dot{q}_0 = (J - J)\\dot{q}_0 = 0',
            correct: true,
          },
          {
            id: 'd',
            latex: 'N = I_n - J^T J \\implies J N \\dot{q}_0 = 0',
            correct: false,
            misconception:
              'Without the inverse $(JJ^T)^{-1}$ inside $J^+$, $J(I - J^T J) = J - J J^T J \\neq 0$ (unless $J$ happens to have orthonormal rows)!',
          },
        ],
        lockedLabel: 'Nullspace Projector N',
        lockedResultLatex: 'N = \\textcolor{#34D399}{I_n - J^+ J}, \\qquad J N \\dot{q}_0 = (J - J J^+ J)\\dot{q}_0 = 0',
        hint: 'Use the fundamental Moore-Penrose identity $J J^+ J = J$ to check which matrix gives $J N = 0$.',
      },
      {
        stepType: 'nullspace_secondary_task',
        badge: 'Apply Nullspace Gradient Projection on 7-DOF Cobots',
        whyThisStep:
          'With the primary hand pose locked by $J^+ v$, choosing $\\dot{q}_0 = k_0 \\nabla_q H(q)$ turns redundancy into active intelligence — maximizing manipulability, recentering joints, or swiveling the elbow around a human coworker.',
        systemImpact:
          'Stepping uphill along the gradient $\\dot{q}_0 = +k_0 \\nabla_q H(q)$ projected through $(I - J^+ J)$ continuously steers the 7-DOF elbow toward higher manipulability or larger obstacle clearance while keeping the tool tip frozen on its surgical or welding path!',
        prompt:
          'How do 7-DOF cobots (Franka Panda, KUKA iiwa) exploit the nullspace vector $\\dot{q}_0$ to maximize a scalar dexterity or clearance objective $H(q)$ without perturbing the end-effector?',
        highlightLatex:
          '\\dot{q} = J^+ v + (I - J^+ J)\\,\\textcolor{#F59E0B}{\\dot{q}_0}, \\qquad \\frac{dH}{dt} = (\\nabla_q H)^T \\dot{q}',
        options: [
          {
            id: 'a',
            latex: '\\text{Set } \\dot{q}_0 = +k_0 \\nabla_q H(q) \\; (k_0 > 0) \\text{ to ascend } H(q) \\text{ (manipulability / obstacle clearance) inside } \\ker(J)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{Set } \\dot{q}_0 = 0 \\text{ always so redundancy never moves any joint}',
            correct: false,
            misconception:
              'Setting $\\dot{q}_0 = 0$ yields the minimum-norm velocity solution, wasting the extra 7th DOF even when the elbow is drifting straight into a table or joint stop!',
          },
          {
            id: 'c',
            latex: '\\text{Add } +k_0 \\nabla_q H(q) \\text{ directly to } v \\text{ in Cartesian space}',
            correct: false,
            misconception:
              '$\\nabla_q H(q) \\in \\mathbb{R}^7$ is a joint-space gradient, not a 6D Cartesian velocity — and adding anything to $v$ would pull the end-effector off its target trajectory!',
          },
          {
            id: 'd',
            latex: '\\text{Set } \\dot{q}_0 = -k_0 \\nabla_q H(q) \\; (k_0 > 0) \\text{ to maximize } H(q)',
            correct: false,
            misconception:
              'Negative gradient descent MINIMIZES $H(q)$! To MAXIMIZE manipulability or obstacle distance $H(q)$, you must ascend along $+k_0 \\nabla_q H(q)$.',
          },
        ],
        lockedLabel: 'Nullspace Gradient Ascent',
        lockedResultLatex: '\\dot{q}_0 = \\textcolor{#34D399}{+k_0 \\nabla_q H(q)} \\;\\implies\\; \\text{elbow dodges obstacles at zero EE error}',
        hint: 'Check the sign of $\\frac{dH}{dt} = (\\nabla H)^T (I - J^+ J) \\dot{q}_0$ using the fact that $N = I - J^+ J$ is positive semidefinite ($N = N^T = N^2$).',
      },
      {
        stepType: 'dls_hard_limit_gap',
        badge: 'Expose Why Unconstrained DLS Fails Hard Joint-Limit Walls',
        whyThisStep:
          'Understanding the exact failure mode of classical DLS + nullspace projection explains WHY modern humanoid and manipulation labs upgraded to constrained Differential QP-IK.',
        systemImpact:
          'Nullspace gradients only act as **soft** springs inside $\\ker(J)$: whenever the primary EE command $J^+ v$ pushes directly against a mechanical hard stop ($q_{\\max}$) or self-collision wall, unconstrained DLS can still violate $q_{\\min} \\le q \\le q_{\\max}$ — motivating hard-constrained QP-IK!',
        prompt:
          'What fundamental weakness remains in unconstrained DLS + Nullspace Projection $\\dot{q} = J_{\\text{DLS}}^+ v + (I - J^+ J)\\dot{q}_0$ on real hardware?',
        highlightLatex:
          '\\text{Primary } J_{\\text{DLS}}^+ v \\text{ vs. Soft Nullspace } (I - J^+ J)\\dot{q}_0 \\quad\\text{at hard wall } \\textcolor{#F59E0B}{q = q_{\\max}}',
        options: [
          {
            id: 'a',
            latex: '\\text{DLS cannot run faster than } 10\\text{ Hz because inverting } 6\\times 6 \\text{ matrices is too slow}',
            correct: false,
            misconception:
              'Inverting a $6\\times 6$ matrix takes less than 2 microseconds on any modern CPU — DLS easily runs past $10\\text{ kHz}$!',
          },
          {
            id: 'b',
            latex: '\\text{Nullspace potentials are soft constraints only — primary } J^+ v \\text{ can still blast straight through hard joint limits } [q_{\\min}, q_{\\max}]',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Nullspace projection only works when } \\lambda = 0 \\text{ and never works on 7-DOF arms}',
            correct: false,
            misconception:
              'Nullspace projection works smoothly on 7-DOF arms (and pairs cleanly with DLS); its limitation is the inability to enforce HARD inequality constraints.',
          },
          {
            id: 'd',
            latex: '\\text{DLS requires a Pieper spherical wrist to compute } J^T',
            correct: false,
            misconception:
              'DLS works on ANY arbitrary kinematic chain or tree (6-DOF, 7-DOF, 30-DOF humanoid) with zero Pieper wrist assumption.',
          },
        ],
        lockedLabel: 'Why QP-IK Is Needed',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{DLS has no hard inequality walls} \\implies \\text{upgrade to Differential QP-IK!}}',
        hint: 'What happens if the primary task $J^+ v$ asks joint 4 to rotate past its physical $170^\\circ$ hard stop?',
      },
    ],
  },

  {
    id: 'kin5-qp-ik-se3-sota',
    tier: 'sota-ik',
    tierLabel: 'SOTA: DLS & QP-IK',
    title: 'Modern SOTA Whole-Body IK: Differential QP-IK (Pink / Mink) on SE(3) Manifolds',
    mechatronicsContext:
      'State-of-the-art humanoid and mobile-manipulation controllers (Pink on Pinocchio, Mink on MuJoCo) solve whole-body IK at >1 kHz as a convex Quadratic Program directly on SE(3) — uniting multi-task objectives with hard joint-limit, speed, and collision-avoidance inequalities. Then we flip the lens to preview Parallel Manipulators!',
    expressionLatex:
      '\\min_{\\dot{q}} \\sum w_i\\|J_i\\dot{q}-v_i^*\\|^2 \\quad \\text{s.t. } C\\dot{q}\\le d',
    finalAnswerLatex:
      '\\mathcal{V}_e = \\log(T^{-1}T_d)^\\vee,\\; \\frac{q_{\\min}-q}{\\Delta t}\\le\\dot{q}\\le\\frac{q_{\\max}-q}{\\Delta t};\\; \\text{Parallel: Easy IK, Hard FK!}',
    diagram: {
      type: 'ik-solver-arch',
      variant: 'qp-ik-se3',
      metric: 'e = log(T⁻¹T_d)∨',
      law: 'min ‖J q̇−v*‖² s.t. C q̇≤d',
      badge: 'Pink / Mink QP',
      subtitle: 'SOTA Differential QP-IK on SE(3)',
    },
    verifyPlot: {
      kind: 'step-compare',
      domain: [0, 1.5],
      setpoint: 0.0,
      setpointLabel: 'Zero SE(3) Pose Error ‖log(T⁻¹T_d)∨‖ = 0',
      primaryLabel: 'QP-IK SE(3) Error (Hard Limits Respected)',
      baselineLabel: 'Euler-Angle Subtract Error (Wrap Glitch)',
      primaryFn: (t) => 1.2 * Math.exp(-3.4 * t),
      baselineFn: (t) => 1.2 * Math.exp(-2.0 * t) + 0.35 * Math.exp(-8 * (t - 0.55) * (t - 0.55)),
      tsMarker: { t: 1.15, label: 'Converged (< 2%)', band: 0.03 },
      defaultCursor: 0.42,
      subtitle:
        'Hover across time $t \\in [0, 1.5]\\text{ s}$: Differential QP-IK (`Pink`/`Mink`) drives the exact Lie-group geodesic error $\\|\\log(T^{-1}T_d)^\\vee\\|$ monotonically to zero while respecting every hard joint limit (Emerald), whereas naive Euler subtraction glitches near wrap-around / gimbal lock (Cyan dashed).',
      domainMeta: 'SOTA Differential QP-IK · SE(3) Geodesic Error · Pink / Mink',
      metrics: [
        { label: 'SE(3) Error', value: 'log(T⁻¹ T_des)∨ ∈ ℝ⁶' },
        { label: 'Hard Limits', value: '(q_min−q)/Δt ≤ q̇ ≤ …' },
        { label: 'Loop Rate', value: '>1 kHz (Pinocchio/MuJoCo)' },
        { label: 'Next Studio', value: 'Parallel: Easy IK, Hard FK ✓' },
      ],
    },
    steps: [
      {
        stepType: 'se3_log_error',
        badge: 'Compute Exact 6D SE(3) Pose Error via Matrix Logarithm',
        whyThisStep:
          'Before a differential IK controller can command velocity, it needs a 6D error vector between current pose $T_{\\text{curr}}$ and target $T_{\\text{des}}$ — subtracting Euler angles breaks violently at $\\pm 180^\\circ$ and gimbal lock.',
        systemImpact:
          'Evaluating $\\mathcal{V}_e = \\log(T_{\\text{curr}}^{-1} T_{\\text{des}})^\\vee \\in \\mathbb{R}^6$ computes the exact shortest-geodesic body-frame twist on $SE(3)$, guaranteeing smooth, wrap-free, coordinate-invariant convergence from ANY starting orientation!',
        prompt:
          'How do modern $SE(3)$ IK libraries (`Pink`, `Mink`, `Pinocchio`) compute the exact 6D body-frame pose error $\\mathcal{V}_e \\in \\mathbb{R}^6$ between current pose $T_{\\text{curr}}$ and desired pose $T_{\\text{des}}$?',
        highlightLatex:
          'T_e = \\textcolor{#22D3EE}{T_{\\text{curr}}^{-1} T_{\\text{des}}} \\in SE(3) \\;\\xrightarrow{\\;\\log(\\cdot)^\\vee\\;}\\; \\textcolor{#34D399}{\\mathcal{V}_e \\in \\mathbb{R}^6}',
        options: [
          {
            id: 'a',
            latex: '\\mathcal{V}_e = \\text{vec}(T_{\\text{des}} - T_{\\text{curr}}) \\text{ (element-wise matrix subtraction)}',
            correct: false,
            misconception:
              'Subtracting $4\\times 4$ matrices directly leaves the curved $SE(3)$ manifold and produces a non-minimal 12-number residual instead of a 6D spatial twist!',
          },
          {
            id: 'b',
            latex: '\\mathcal{V}_e = \\log(T_{\\text{curr}}^{-1} T_{\\text{des}})^\\vee \\in \\mathbb{R}^6 \\text{ (Lie-group matrix logarithm)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\mathcal{V}_e = [p_{\\text{des}}-p_{\\text{curr}},\\; \\text{RPY}_{\\text{des}} - \\text{RPY}_{\\text{curr}}]^T',
            correct: false,
            misconception:
              'Subtracting roll-pitch-yaw Euler angles suffers from $\\pm\\pi$ wrap-around jumps, gimbal lock at $\\pm 90^\\circ$ pitch, and non-geodesic tumbling!',
          },
          {
            id: 'd',
            latex: '\\mathcal{V}_e = \\exp(T_{\\text{curr}}^{-1} T_{\\text{des}})^\\vee \\in \\mathbb{R}^6',
            correct: false,
            misconception:
              'Wrong direction! $\\exp$ maps algebra $\\mathfrak{se}(3) \\to$ group $SE(3)$; extracting a 6D error twist from a group pose $T_e \\in SE(3)$ requires the INVERSE map $\\log(\\cdot)^\\vee$!',
          },
        ],
        lockedLabel: 'SE(3) Log Pose Error',
        lockedResultLatex: '\\mathcal{V}_e = \\textcolor{#34D399}{\\log(T_{\\text{curr}}^{-1} T_{\\text{des}})^\\vee \\in \\mathbb{R}^6}',
        hint: 'What inverse map takes a relative rigid transform $T_e = T_{\\text{curr}}^{-1} T_{\\text{des}} \\in SE(3)$ back to its 6D twist vector in $\\mathfrak{se}(3)$?',
      },
      {
        stepType: 'weighted_multitask_qp',
        badge: 'Formulate the Weighted Multi-Task Differential QP',
        whyThisStep:
          'A humanoid or dual-arm cobot must track BOTH hands, keep its Center of Mass over its feet, and stay near a comfortable posture simultaneously — a single quadratic objective balances every task cleanly.',
        systemImpact:
          'Expanding $\\min_{\\dot{q}} \\sum_i w_i \\|J_i \\dot{q} - v_i^*\\|^2 + \\lambda \\|\\dot{q}\\|^2$ produces a tiny strictly convex QP $\\frac{1}{2}\\dot{q}^T H \\dot{q} + c^T \\dot{q}$ (with $H = 2(\\sum w_i J_i^T J_i + \\lambda I) \\succ 0$) that OSQP/ProxQP solves in $<0.2\\text{ ms}$!',
        prompt:
          'Select the standard weighted multi-task Differential QP objective (used in `Pink` and `Mink`) that simultaneously tracks $K$ tasks $(J_i, v_i^*)$ with DLS regularization $\\lambda > 0$.',
        highlightLatex:
          '\\min_{\\dot{q} \\in \\mathbb{R}^n} \\; \\frac{1}{2}\\dot{q}^T \\textcolor{#22D3EE}{H}\\, \\dot{q} + \\textcolor{#F59E0B}{c^T} \\dot{q} \\quad \\text{with } H \\succ 0',
        options: [
          {
            id: 'a',
            latex: '\\min_{\\dot{q}} \\sum_{i=1}^{K} w_i \\|J_i(q)\\dot{q} - v_i^*\\|^2 + \\lambda \\|\\dot{q}\\|^2 \\quad (w_i > 0,\\; \\lambda > 0)',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\min_{q} \\sum_{i=1}^{K} w_i \\|T_i(q) - T_i^*\\|^2 \\quad \\text{(solved linearly in one step)}',
            correct: false,
            misconception:
              'Forward kinematics $T_i(q)$ is NONLINEAR in $q$ (sines and cosines), so optimizing directly over $q$ is a non-convex NLP, NOT a convex quadratic program!',
          },
          {
            id: 'c',
            latex: '\\min_{\\dot{q}} \\sum_{i=1}^{K} w_i (J_i \\dot{q} - v_i^*) \\quad \\text{(un-squared linear sum)}',
            correct: false,
            misconception:
              'An un-squared linear objective is unbounded below ($\\dot{q} \\to -\\infty$) and doesn’t even produce a scalar if $J_i\\dot{q} - v_i^*$ is a vector!',
          },
          {
            id: 'd',
            latex: '\\min_{\\dot{q}} \\sum_{i=1}^{K} w_i \\|J_i \\dot{q} - v_i^*\\|^2 - \\lambda \\|\\dot{q}\\|^2',
            correct: false,
            misconception:
              'Subtracting $-\\lambda \\|\\dot{q}\\|^2$ makes the Hessian indefinite/non-convex and REWARDS infinite joint velocity!',
          },
        ],
        lockedLabel: 'Multi-Task QP Objective',
        lockedResultLatex: '\\textcolor{#34D399}{\\min_{\\dot{q}} \\sum_i w_i \\|J_i\\dot{q} - v_i^*\\|^2 + \\lambda\\|\\dot{q}\\|^2 \\; (H \\succ 0)}',
        hint: 'Each task residual $\\|J_i\\dot{q} - v_i^*\\|^2$ is quadratic and convex in $\\dot{q}$, plus a positive damping term $+\\lambda\\|\\dot{q}\\|^2$.',
      },
      {
        stepType: 'qp_hard_inequalities',
        badge: 'Encode Hard Linear Inequality Constraints C q̇ ≤ d',
        whyThisStep:
          'This is the exact superpower that beats unconstrained DLS: every physical limit — joint stops, motor speed caps, and CBF-style collision dampers — translates into an exact linear inequality on $\\dot{q}$!',
        systemImpact:
          'Enforcing $q_{\\min} \\le q + \\dot{q}\\Delta t \\le q_{\\max}$ directly as $\\frac{q_{\\min}-q}{\\Delta t} \\le \\dot{q} \\le \\frac{q_{\\max}-q}{\\Delta t}$ alongside $|\\dot{q}| \\le \\dot{q}_{\\max}$ and collision velocity dampers guarantees ZERO hard-stop violations at every control tick!',
        prompt:
          'Using Euler integration $q_{\\text{next}} = q + \\dot{q}\\Delta t$, how are hard joint-position limits $q_{\\min} \\le q_{\\text{next}} \\le q_{\\max}$ encoded as linear QP constraints on $\\dot{q}$?',
        highlightLatex:
          'q_{\\min} \\le q + \\textcolor{#F59E0B}{\\dot{q}}\\,\\Delta t \\le q_{\\max}, \\qquad |\\dot{q}| \\le \\dot{q}_{\\max}',
        options: [
          {
            id: 'a',
            latex: 'q_{\\min} \\le \\dot{q} \\le q_{\\max}',
            correct: false,
            misconception:
              'Unit error! $q_{\\min}, q_{\\max}$ are angles ($\\text{rad}$), whereas $\\dot{q}$ is velocity ($\\text{rad/s}$); you must subtract current $q$ and divide by timestep $\\Delta t$!',
          },
          {
            id: 'b',
            latex: '\\frac{q_{\\min} - q}{\\Delta t} \\le \\dot{q} \\le \\frac{q_{\\max} - q}{\\Delta t} \\;\\text{(intersected with } |\\dot{q}|\\le\\dot{q}_{\\max} \\text{ \\& collision dampers)}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\frac{q - q_{\\min}}{\\Delta t} \\le \\dot{q} \\le \\frac{q - q_{\\max}}{\\Delta t}',
            correct: false,
            misconception:
              'Reversed signs! When $q < q_{\\max}$, $(q - q_{\\max})/\\Delta t < 0$, which would forbid moving positively toward the valid interior!',
          },
          {
            id: 'd',
            latex: '\\|q + \\dot{q}\\Delta t\\|^2 \\le q_{\\max}^2 \\;\\text{(always requires nonlinear SQP)}',
            correct: false,
            misconception:
              'Per-joint box limits $q_{\\min} \\le q + \\dot{q}\\Delta t \\le q_{\\max}$ are strictly LINEAR in $\\dot{q}$ — that’s why a fast convex QP suffices with zero nonlinear SQP!',
          },
        ],
        lockedLabel: 'QP Linear Inequalities',
        lockedResultLatex: '\\textcolor{#34D399}{\\frac{q_{\\min}-q}{\\Delta t} \\le \\dot{q} \\le \\frac{q_{\\max}-q}{\\Delta t},\\quad |\\dot{q}|\\le\\dot{q}_{\\max},\\quad C_{\\text{obs}}\\dot{q}\\le d_{\\text{obs}}}',
        hint: 'Subtract $q$ from all three parts of $q_{\\min} \\le q + \\dot{q}\\Delta t \\le q_{\\max}$, then divide by $\\Delta t > 0$.',
      },
      {
        stepType: 'modern_ik_stack',
        badge: 'Compare the Modern Production IK Stack (IKFast vs TRAC-IK vs Pink/Mink)',
        whyThisStep:
          'A senior robotics engineer picks the right IK tool for the job — global offline pick-and-place sampling has completely different requirements from 1 kHz teleoperated humanoid control.',
        systemImpact:
          'Use **IKFast** for $\\mu\\text{s}$ closed-form all-branch queries on fixed 6-DOF industrial arms, **TRAC-IK** for single-shot global IK with limits on arbitrary arms, and **Pink/Mink** for continuous $>1\\text{ kHz}$ whole-body $SE(3)$ QP-IK with hard collision & posture constraints!',
        prompt:
          'Match the three pillars of the modern production IK stack (`IKFast`, `TRAC-IK`, `Pink`/`Mink`) to their exact engineering niche.',
        highlightLatex:
          '\\text{Analytical (}\\mu\\text{s)} \\quad\\text{vs.}\\quad \\text{Global SQP} \\quad\\text{vs.}\\quad \\textcolor{#34D399}{\\text{1 kHz Whole-Body QP-IK}}',
        options: [
          {
            id: 'a',
            latex: '\\text{IKFast: closed-form } \\mu\\text{s all-branch; TRAC-IK: concurrent KDL+SQP global IK; Pink/Mink: 1 kHz } SE(3)\\text{ QP-IK}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\text{IKFast: 1 kHz humanoid QP; TRAC-IK: closed-form 6-DOF; Pink/Mink: 2D planar DH tables only}',
            correct: false,
            misconception:
              'Roles scrambled! `IKFast` compiles closed-form analytical C++ equations, while `Pink` (Pinocchio) and `Mink` (MuJoCo) are the real-time whole-body differential QP-IK libraries.',
          },
          {
            id: 'c',
            latex: '\\text{All three solve unconstrained pseudoinverse } J^+ e \\text{ and ignore joint limits}',
            correct: false,
            misconception:
              'All three explicitly handle joint limits — `IKFast` filters exact branches, `TRAC-IK` runs constrained SQP, and `Pink`/`Mink` enforce hard linear QP bounds every tick!',
          },
          {
            id: 'd',
            latex: '\\text{Pink/Mink replaces forward kinematics so Pinocchio and MuJoCo are no longer needed}',
            correct: false,
            misconception:
              '`Pink` runs directly ON TOP of `Pinocchio`, and `Mink` runs directly ON TOP of `MuJoCo` to obtain exact $SE(3)$ poses $T(q)$ and Jacobians $J(q)$ at every timestep!',
          },
        ],
        lockedLabel: 'Production IK Stack',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{IKFast (}\\mu\\text{s exact)} \\;|\\; \\text{TRAC-IK (SQP)} \\;|\\; \\text{Pink/Mink (1 kHz QP-IK)}}',
        hint: 'Recall: `IKFast` = symbolic closed-form C++, `TRAC-IK` = KDL + NLopt SQP, `Pink`/`Mink` = real-time QP-IK on Pinocchio/MuJoCo.',
      },
      {
        stepType: 'parallel_preview_flip',
        badge: 'Preview Next Studio: How Parallel Manipulators Flip the Script!',
        whyThisStep:
          'Closing out Serial Kinematics by contrasting open chains against closed-chain Parallel Manipulators (Delta, Stewart-Gough) prepares your intuition for the next robotics module.',
        systemImpact:
          'In **Parallel Manipulators**, the kinematic difficulty **flips 180°**: Inverse Kinematics becomes trivial closed-form leg-length subtraction ($\\ell_i = \\|p + R b_i - a_i\\|$), while **Forward Kinematics** becomes a hard coupled nonlinear loop-closure system (up to **40** real poses on a general 6-6 Stewart platform)!',
        prompt:
          'When you move from open-chain **Serial Arms** to closed-chain **Parallel Manipulators** (Delta & Stewart-Gough hexapods), how do Forward Kinematics (FK) and Inverse Kinematics (IK) trade places?',
        highlightLatex:
          '\\text{Serial: Easy FK, Hard IK} \\quad\\xrightarrow{\\;\\text{Closed Loops}\\;}\\quad \\textcolor{#34D399}{\\text{Parallel: } \\ell_i = \\|p + R b_i - a_i\\|}',
        options: [
          {
            id: 'a',
            latex: '\\text{Both FK and IK become trivial linear matrix multiplications}',
            correct: false,
            misconception:
              'Only Inverse Kinematics becomes trivial! Solving Forward Kinematics from 6 leg lengths $\\ell_1, \\dots, \\ell_6$ requires solving 6 coupled quadratic loop-closure equations in $SE(3)$!',
          },
          {
            id: 'b',
            latex: '\\text{Parallel robots have the exact same easy FK and hard multi-branch IK as serial arms}',
            correct: false,
            misconception:
              'Closed kinematic loops invert the causality completely: given platform pose $(p, R)$, every leg’s attachment point is immediately known, making IK closed-form and unique!',
          },
          {
            id: 'c',
            latex: '\\text{IK becomes trivial closed-form vector length } (\\ell_i = \\|p + R b_i - a_i\\|)\\text{, while FK becomes hard nonlinear loop-closure (up to 40 modes!)}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Parallel robots eliminate all singularities because every leg acts in parallel}',
            correct: false,
            misconception:
              'Parallel robots actually introduce a brand-new, dangerous **Type-II (Parallel/Actuation) Singularity** where the platform gains uncontrollable motion even when ALL actuators are locked!',
          },
        ],
        lockedLabel: 'Parallel Flip Preview',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Parallel: Trivial Closed-Form IK } (\\ell_i) \\;\\&\\; \\text{Hard Nonlinear FK (up to 40 modes)}}',
        hint: 'If you ALREADY know platform position $p$ and rotation $R$, how hard is it to measure the straight-line distance from base anchor $a_i$ to platform anchor $p + R b_i$?',
      },
    ],
  },
];
