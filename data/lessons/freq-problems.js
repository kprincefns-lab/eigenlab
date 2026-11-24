/**
 * EIGENLAB — Controls 03: Root Locus, Bode Frequency Design, Lead-Lag & Robustness
 * 10 deep, engineering-grade, multi-part (5–6 steps each) control problems spanning:
 * Root Locus Geometry & Angle Design, Bode Asymptotes & Resonance, Exact Gain/Phase
 * Margins, Phase-Lead & Phase-Lag Synthesis, Sensitivity Waterbed Trade-offs, and
 * Nyquist Stability for Open-Loop Unstable Plants.
 *
 * Every step includes:
 *  - whyThisStep  : Spoiler-free engineering rationale shown while solving.
 *  - systemImpact : Physical takeaway revealed on lock-in & pinned in the ledger.
 *
 * Color convention inside KaTeX highlights:
 *  - Cyan   (#22D3EE): Open-loop plant G(s) / L(s) / frequency ω / poles
 *  - Amber  (#F59E0B): Gain K / phase target φm / crossover ωgc / critical point −1
 *  - Emerald(#34D399): Solved step result / compensator C(s) / exact margins & bounds
 */

export const FREQ_SOLVER_TIERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'root-locus', label: 'Root Locus' },
  { id: 'bode-freq', label: 'Bode & Resonance' },
  { id: 'compensators', label: 'Lead-Lag Design' },
  { id: 'robustness', label: 'Margins & Sensitivity' },
];

export const FREQ_PROBLEMS = [
  // =========================================================================
  // TIER 1: ROOT LOCUS GEOMETRY & ZERO PLACEMENT (3 problems)
  // =========================================================================
  {
    id: 'frq1-rl-asymptotes',
    tier: 'root-locus',
    tierLabel: 'Root Locus',
    title: '3-Pole Root Locus Geometry & Instability Limit',
    mechatronicsContext:
      'A three-stage electro-hydraulic servo valve combining an integrator with two spool/actuator lags traces three root-locus branches as proportional gain rises; mapping its asymptotes and breakaway predicts the exact gain where instability erupts.',
    expressionLatex: 'L(s)=\\frac{K}{s(s+2)(s+4)} \\;\\;(\\text{Root Locus})',
    finalAnswerLatex:
      '\\sigma_a=-2,\\; \\phi=\\pm 60^\\circ,180^\\circ, \\quad s_b\\approx -0.845, \\quad K_u=48\\;(\\omega_u=2\\sqrt{2})',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -6.5, maxRe: 1.8, minIm: -4.2, maxIm: 4.2 },
      gainSweep: { a2: 6, a1: 8, kMin: 0.2, kMax: 72, ku: 48 },
      defaultCursor: 0.665,
      subtitle:
        'Hover or drag horizontally to sweep proportional gain $K \\in [0.2, 72]$: watch the poles break away at $s=-0.845$, bend along the $\\pm 60^\\circ$ asymptotes, and cross $j\\omega$ at $K_u = 48$ ($\\omega_u = 2.83$).',
      domainMeta: 'Interactive 3-Pole Root Locus · Drag K ∈ [0.2, 72] · Ku = 48',
      metrics: [
        { label: 'Asymptotes', value: '±60°, 180° at σ_a=−2' },
        { label: 'Breakaway s_b', value: '−2 + 2/√3 ≈ −0.845' },
        { label: 'Ultimate Ku', value: '48.0 (Routh limit)' },
        { label: 'Crossing ωu', value: '±2√2 j ≈ ±2.83j ✓' },
      ],
    },
    steps: [
      {
        stepType: 'real_axis',
        badge: 'Real-Axis Locus Segments',
        whyThisStep:
          'The odd-count real-axis rule instantly reveals which intervals on the real line can host closed-loop poles as $K$ sweeps from $0$ to $\\infty$, anchoring the entire root locus sketch.',
        systemImpact:
          'Because $(-2, 0)$ lies on the locus with two open-loop poles at its endpoints, those two poles MUST march toward each other and collide into complex oscillatory pairs.',
        prompt:
          'Apply the real-axis rule (odd count of open-loop poles + zeros strictly to the right) to $L(s) = \\frac{K}{s(s+2)(s+4)}$ with poles at $0, -2, -4$.',
        highlightLatex:
          '\\text{Poles at } \\textcolor{#22D3EE}{0,\\; -2,\\; -4} \\;\\;\\longrightarrow\\;\\; \\text{odd count to the right}',
        options: [
          {
            id: 'a',
            latex: '(-2,\\,0) \\;\\cup\\; (-\\infty,\\,-4)',
            correct: true,
          },
          {
            id: 'b',
            latex: '(-4,\\,-2) \\;\\cup\\; (0,\\,+\\infty)',
            correct: false,
            misconception:
              'Between $-4$ and $-2$ there are TWO poles ($0$ and $-2$) to the right (even count → NOT on locus); right of $0$ there are ZERO poles to the right.',
          },
          {
            id: 'c',
            latex: '(-4,\\,0)',
            correct: false,
            misconception:
              'The locus skips $(-4, -2)$ because that interval has an EVEN number ($2$) of poles to its right.',
          },
          {
            id: 'd',
            latex: '(-\\infty,\\,0)',
            correct: false,
            misconception:
              'Each real-axis pole flips parity between odd and even; only alternate intervals belong to the locus.',
          },
        ],
        lockedLabel: 'Real-Axis Locus',
        lockedResultLatex: '\\textcolor{#34D399}{(-2,\\,0) \\;\\cup\\; (-\\infty,\\,-4)}',
        hint: 'Count poles strictly to the right of a test point in each interval: $(0,\\infty)$, $(-2,0)$, $(-4,-2)$, $(-\\infty,-4)$.',
      },
      {
        stepType: 'asymptotes',
        badge: 'Asymptote Angles & Centroid',
        whyThisStep:
          'For high gain $K \\to \\infty$, the $n - m$ excess poles escape to infinity along straight rays — their angles and intersection centroid tell you immediately whether high gain destabilizes the loop.',
        systemImpact:
          'Anchored at $\\sigma_a = -2$, the two $\\pm 60^\\circ$ rays lean straight toward the unstable Right Half-Plane, guaranteeing instability above a finite gain ceiling.',
        prompt:
          'With $n = 3$ poles ($0, -2, -4$) and $m = 0$ finite zeros, compute the asymptote angles $\\phi_k = \\frac{(2k+1)180^\\circ}{n-m}$ and centroid $\\sigma_a = \\frac{\\sum p_i - \\sum z_j}{n-m}$.',
        highlightLatex:
          '\\phi_k = \\frac{(2k+1)180^\\circ}{\\textcolor{#22D3EE}{3}}, \\qquad \\sigma_a = \\frac{\\textcolor{#22D3EE}{0 + (-2) + (-4)}}{\\textcolor{#22D3EE}{3}}',
        options: [
          {
            id: 'a',
            latex: '\\phi = \\pm 90^\\circ,\\; 180^\\circ, \\qquad \\sigma_a = -2',
            correct: false,
            misconception:
              'Divide $180^\\circ$ by $n - m = 3$ (not $2$): $\\phi = \\pm 60^\\circ, 180^\\circ$. ($\\pm 90^\\circ$ is for relative degree $2$.)',
          },
          {
            id: 'b',
            latex: '\\phi = \\pm 60^\\circ,\\; 180^\\circ, \\qquad \\sigma_a = -2',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\phi = \\pm 60^\\circ,\\; 180^\\circ, \\qquad \\sigma_a = -6',
            correct: false,
            misconception:
              'Remember to divide the pole sum $(-6)$ by the excess pole count $n - m = 3$: $\\sigma_a = -6/3 = -2$.',
          },
          {
            id: 'd',
            latex: '\\phi = \\pm 45^\\circ,\\; \\pm 135^\\circ, \\qquad \\sigma_a = -2',
            correct: false,
            misconception:
              'Four asymptotes ($\\pm 45^\\circ, \\pm 135^\\circ$) belong to a 4-pole excess ($n - m = 4$); here $n - m = 3$.',
          },
        ],
        lockedLabel: 'Asymptotes',
        lockedResultLatex: '\\textcolor{#34D399}{\\phi = \\pm 60^\\circ,\\; 180^\\circ, \\quad \\sigma_a = -2}',
        hint: 'Evaluate $(2k+1)180^\\circ/3$ for $k = 0, 1, 2$ and average the three poles.',
      },
      {
        stepType: 'breakaway',
        badge: 'Real-Axis Breakaway Point',
        whyThisStep:
          'Finding where $\\frac{dK}{ds} = 0$ pinpoints the exact critical-damping breakaway where the two dominant poles leave the real axis and start oscillating.',
        systemImpact:
          'The poles break away at $s_b \\approx -0.845$ (at a tiny gain $K \\approx 3.08$) — meaning any practical servo gain puts this hydraulic valve in the complex underdamped regime!',
        prompt:
          'Write $K(s) = -(s^3 + 6s^2 + 8s)$, set $\\frac{dK}{ds} = 0$, and select the valid breakaway root lying on the locus segment $(-2, 0)$.',
        highlightLatex:
          '\\frac{d}{ds}\\!\\left(\\textcolor{#22D3EE}{s^3 + 6s^2 + 8s}\\right) = 3s^2 + 12s + 8 = 0',
        options: [
          {
            id: 'a',
            latex: 's = -1.0',
            correct: false,
            misconception:
              '$-1$ is the midpoint of $(-2, 0)$, but the third pole at $-4$ pushes the breakaway closer to the origin ($3(-1)^2 + 12(-1) + 8 = -1 \\neq 0$).',
          },
          {
            id: 'b',
            latex: 's = -2 - \\frac{2}{\\sqrt{3}} \\approx -3.155',
            correct: false,
            misconception:
              'That second root lies in $(-4, -2)$, which is NOT on the $K > 0$ root locus (it belongs to the negative-$K$ complementary locus!).',
          },
          {
            id: 'c',
            latex: 's = -2 + \\frac{2}{\\sqrt{3}} \\approx -0.845',
            correct: true,
          },
          {
            id: 'd',
            latex: 's = -2 + \\frac{4}{\\sqrt{3}} \\approx +0.309',
            correct: false,
            misconception:
              'Check the quadratic formula on $3s^2 + 12s + 8 = 0$: $s = \\frac{-12 \\pm \\sqrt{144 - 96}}{6} = -2 \\pm \\frac{\\sqrt{48}}{6} = -2 \\pm \\frac{2}{\\sqrt{3}}$.',
          },
        ],
        lockedLabel: 'Breakaway Point',
        lockedResultLatex: 's_b = \\textcolor{#34D399}{-2 + \\frac{2}{\\sqrt{3}} \\approx -0.845}',
        hint: 'Solve $3s^2 + 12s + 8 = 0$ and keep the root inside $(-2, 0)$.',
      },
      {
        stepType: 'jw_crossing',
        badge: 'Exact jω-Axis Crossing',
        whyThisStep:
          'Using the Routh criterion (or substituting $s = j\\omega$) gives the hard stability ceiling $K_u$ and ringing frequency $\\omega_u$ where the locus breaches the imaginary axis.',
        systemImpact:
          'At $K_u = 48$, the valve hits sustained oscillation at $\\omega_u = 2\\sqrt{2} \\approx 2.83\\text{ rad/s}$ ($T_u \\approx 2.22\\text{ s}$); keeping $K \\le 16$ preserves at least $9.5\\text{ dB}$ of Gain Margin.',
        prompt:
          'Apply the cubic Routh bound ($a_2 a_1 > a_0$) and auxiliary equation to $s^3 + 6s^2 + 8s + K = 0$ to find $K_u$ and $\\omega_u$.',
        highlightLatex:
          's^3 + \\textcolor{#22D3EE}{6}s^2 + \\textcolor{#22D3EE}{8}s + \\textcolor{#F59E0B}{K} = 0 \\implies K_u = a_2 a_1,\\;\\; a_2 s^2 + K_u = 0',
        options: [
          {
            id: 'a',
            latex: 'K_u = 48, \\qquad \\omega_u = 2\\sqrt{2} \\approx 2.83\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'K_u = 48, \\qquad \\omega_u = \\sqrt{48} \\approx 6.93\\text{ rad/s}',
            correct: false,
            misconception:
              'Divide by $a_2 = 6$ in the auxiliary equation $6s^2 + 48 = 0$: $\\omega_u^2 = 48/6 = 8$, so $\\omega_u = \\sqrt{8} = 2\\sqrt{2}$.',
          },
          {
            id: 'c',
            latex: 'K_u = 14, \\qquad \\omega_u = \\sqrt{8} \\approx 2.83\\text{ rad/s}',
            correct: false,
            misconception:
              'Multiply $a_2 \\cdot a_1 = 6 \\times 8 = 48$ (not add $6 + 8 = 14$).',
          },
          {
            id: 'd',
            latex: 'K_u = 24, \\qquad \\omega_u = 2\\text{ rad/s}',
            correct: false,
            misconception:
              'Plug $s = j\\omega$ directly: $(-j\\omega^3 + 8j\\omega) + (-6\\omega^2 + K) = 0 \\implies \\omega^2 = 8$ and $K = 6\\omega^2 = 48$.',
          },
        ],
        lockedLabel: 'jω-Axis Limit',
        lockedResultLatex: 'K_u = \\textcolor{#34D399}{48}, \\qquad \\omega_u = \\textcolor{#34D399}{2\\sqrt{2} \\approx 2.83\\text{ rad/s}}',
        hint: 'Set $K_u = 6 \\cdot 8 = 48$ and solve $6s^2 + 48 = 0$.',
      },
      {
        stepType: 'asymptote_insight',
        badge: 'Why 3 Poles Always Cross RHP',
        whyThisStep:
          'Recognizing the universal geometric danger of relative degree $n - m \\ge 3$ explains why adding a phase-lead zero (reducing excess poles from $3 \\to 2$) can rescue an unstable loop.',
        systemImpact:
          'Every $n - m = 3$ plant has $\\pm 60^\\circ$ asymptotes leaning into the RHP, forcing two poles unstable at high $K$; adding a single LHP zero bends the asymptotes to $\\pm 90^\\circ$, keeping all branches in the LHP!',
        prompt:
          'Geometrically, why does ANY minimum-phase system with relative degree $n - m = 3$ inevitably become unstable at sufficiently large proportional gain $K$?',
        highlightLatex:
          'n - m = 3 \\implies \\phi = \\{\\textcolor{#F59E0B}{+60^\\circ,\\; -60^\\circ},\\; 180^\\circ\\}',
        options: [
          {
            id: 'a',
            latex: '\\text{The centroid } \\sigma_a \\text{ always sits in the RHP}',
            correct: false,
            misconception:
              'Here $\\sigma_a = -2 < 0$ is safely in the LHP, yet the locus STILL enters the RHP because of the $\\pm 60^\\circ$ ray angles!',
          },
          {
            id: 'b',
            latex: '\\text{The real pole escapes to } +\\infty \\text{ along } 0^\\circ',
            correct: false,
            misconception:
              'The single real-axis asymptote goes to $-\\infty$ along $180^\\circ$ (deeper into the LHP), not $+\\infty$.',
          },
          {
            id: 'c',
            latex: '\\pm 60^\\circ \\text{ asymptotes pull two poles into RHP } (\\operatorname{Re} s > 0)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{The integrator at } s=0 \\text{ cannot be stabilized by any } K',
            correct: false,
            misconception:
              'The loop IS stable for all $0 < K < 48$ — it only destabilizes once the $\\pm 60^\\circ$ branches cross into $\\operatorname{Re}(s) > 0$.',
          },
        ],
        lockedLabel: 'Relative-Degree Rule',
        lockedResultLatex: '\\textcolor{#34D399}{\\pm 60^\\circ\\text{ asymptotes pull 2 poles into RHP for } K > K_u}',
        hint: 'Notice $\\cos(\\pm 60^\\circ) = +0.5 > 0$: rays at $\\pm 60^\\circ$ head rightward into $\\operatorname{Re}(s) > 0$.',
      },
    ],
  },

  {
    id: 'frq1-rl-angle-zero',
    tier: 'root-locus',
    tierLabel: 'Root Locus',
    title: 'Root-Locus Angle Condition & PD Zero Placement',
    mechatronicsContext:
      'When a DC motor\'s uncompensated vertical root locus sits too close to the imaginary axis to meet your settling spec, placing a single PD zero via the angle condition pulls the entire locus cleanly through your exact target pole.',
    expressionLatex: 'G(s)=\\frac{1}{s(s+4)},\\;\\; s_d=-3+3j',
    finalAnswerLatex:
      '\\theta_z=\\arctan(0.5)\\approx 26.6^\\circ \\implies z=9,\\;\\; K=2 \\;\\;(C(s)=2s+18)',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -10.5, maxRe: 1.5, minIm: -4.5, maxIm: 4.5 },
      poles: [
        { re: -3, im: 3, label: 'sd = −3+3j', status: 'lhp' },
        { re: -3, im: -3, label: 'sd* = −3−3j', status: 'lhp' },
      ],
      zeros: [{ re: -9, im: 0, label: 'PD Zero z=−9' }],
      hudLabel: 'PD C(s)=2(s+9) → Exact CL Poles −3±3j (K=2, z=−9)',
      defaultCursor: 0.5,
      subtitle:
        'Complex $s$-plane verification: the uncompensated vertical asymptote sat stuck at $\\sigma = -2$; adding zero $z=-9$ (○) and gain $K=2$ bends the closed-loop poles directly onto $s_d = -3 \\pm 3j$ (×)!',
      domainMeta: 'PD Zero Synthesis · Uncomp σ=−2 → Compensated sd=−3±3j',
      metrics: [
        { label: 'Angle Deficiency', value: '+26.57° (arctan 0.5)' },
        { label: 'Exact Zero z', value: 's = −9.0 (exact!)' },
        { label: 'Exact Gain K', value: 'K = 2.0 (exact!)' },
        { label: 'Check Char Poly', value: 's²+6s+18 → −3±3j ✓' },
      ],
    },
    steps: [
      {
        stepType: 'uncomp_angles',
        badge: 'Open-Loop Pole Angles at sd',
        whyThisStep:
          'A point $s_d$ lies on the root locus if and only if the net phase of $L(s_d)$ equals $-180^\\circ$; measuring the plant\'s pole angles at $s_d$ quantifies the exact phase deficit.',
        systemImpact:
          'Because the plant poles alone sum to $206.6^\\circ \\neq 180^\\circ$, NO scalar proportional gain $K$ can ever reach $s_d = -3 + 3j$ (uncompensated poles are trapped on $\\sigma = -2$!).',
        prompt:
          'Evaluate the vector angles $\\theta_{p1} = \\angle(s_d - 0)$ and $\\theta_{p2} = \\angle(s_d + 4)$ from the plant poles ($0, -4$) to $s_d = -3 + 3j$.',
        highlightLatex:
          's_d - 0 = \\textcolor{#22D3EE}{-3 + 3j}, \\qquad s_d - (-4) = \\textcolor{#F59E0B}{+1 + 3j}',
        options: [
          {
            id: 'a',
            latex: '\\theta_{p1} = 45^\\circ, \\quad \\theta_{p2} = \\arctan(3) \\approx 71.6^\\circ',
            correct: false,
            misconception:
              'Watch the quadrant! $-3 + 3j$ sits in Quadrant II (negative real, positive imaginary), so $\\angle(-3 + 3j) = 180^\\circ - 45^\\circ = 135^\\circ$, not $45^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\theta_{p1} = 135^\\circ, \\quad \\theta_{p2} = \\arctan(3) \\approx 71.6^\\circ',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\theta_{p1} = 135^\\circ, \\quad \\theta_{p2} = 180^\\circ - \\arctan(3) \\approx 108.4^\\circ',
            correct: false,
            misconception:
              '$s_d - (-4) = (-3+4) + 3j = +1 + 3j$ sits in Quadrant I (positive real part!), so its angle is $+\\arctan(3) \\approx 71.6^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\theta_{p1} = 135^\\circ, \\quad \\theta_{p2} = \\arctan(1/3) \\approx 18.4^\\circ',
            correct: false,
            misconception:
              'Angle is $\\arctan(\\text{imag}/\\text{real}) = \\arctan(3/1) = \\arctan(3) \\approx 71.6^\\circ$, not $\\arctan(1/3)$.',
          },
        ],
        lockedLabel: 'Plant Pole Angles',
        lockedResultLatex:
          '\\theta_{p1}=\\textcolor{#34D399}{135^\\circ},\\; \\theta_{p2}=\\textcolor{#34D399}{\\arctan(3)\\approx 71.6^\\circ} \\;\\;(\\Sigma=206.6^\\circ)',
        hint: 'Measure each angle counter-clockwise from the $+\\sigma$ horizontal axis to the vector $(s_d - p_i)$.',
      },
      {
        stepType: 'angle_deficiency',
        badge: 'Angle Deficiency for PD Zero',
        whyThisStep:
          'The angle deficiency tells you the EXACT phase lead a PD zero $(s + z)$ must supply at $s_d$ to bend the root locus right through your target pole.',
        systemImpact:
          'Supplying $+26.57^\\circ$ ($= \\arctan(0.5)$ exactly!) of phase lead cancels the $206.57^\\circ$ plant lag back down to $-180^\\circ$, locking $s_d$ onto the locus.',
        prompt:
          'Using the angle condition $\\theta_z - (\\theta_{p1} + \\theta_{p2}) = -180^\\circ$, solve for the exact zero angle $\\theta_z$ needed at $s_d = -3 + 3j$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{\\theta_z} = (\\textcolor{#22D3EE}{135^\\circ + \\arctan 3}) - 180^\\circ = \\arctan(3) - 45^\\circ',
        options: [
          {
            id: 'a',
            latex: '\\theta_z = \\arctan(0.5) \\approx 26.57^\\circ',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\theta_z = 180^\\circ - 206.57^\\circ = -26.57^\\circ',
            correct: false,
            misconception:
              'Zeros contribute POSITIVE phase ($+\\theta_z$): $\\theta_z - 206.57^\\circ = -180^\\circ \\implies \\theta_z = +26.57^\\circ$.',
          },
          {
            id: 'c',
            latex: '\\theta_z = 360^\\circ - 206.57^\\circ = 153.43^\\circ',
            correct: false,
            misconception:
              'We target odd multiples of $180^\\circ$ ($-180^\\circ$), not $360^\\circ$: $206.57^\\circ - 180^\\circ = 26.57^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\theta_z = 45^\\circ',
            correct: false,
            misconception:
              'Compute $\\tan(\\arctan 3 - 45^\\circ) = \\frac{3 - 1}{1 + 3\\cdot 1} = \\frac{2}{4} = 0.5$, giving $\\arctan(0.5) \\approx 26.57^\\circ$.',
          },
        ],
        lockedLabel: 'Angle Deficiency',
        lockedResultLatex: '\\theta_z = \\textcolor{#34D399}{\\arctan(0.5) \\approx 26.57^\\circ}',
        hint: 'Use $\\tan(A - B) = \\frac{\\tan A - \\tan B}{1 + \\tan A\\tan B}$ with $\\tan A = 3, \\tan B = 1$.',
      },
      {
        stepType: 'solve_zero',
        badge: 'Exact Zero Location z',
        whyThisStep:
          'Right-triangle geometry on the $s$-plane turns the required phase angle $\\theta_z$ straight into the physical controller zero $s = -z$ (i.e. ratio $K_p/K_d = z$).',
        systemImpact:
          'Placing the zero cleanly at $s = -9$ guarantees the compensated root locus passes directly through $-3 \\pm 3j$!',
        prompt:
          'For a zero at $s = -z$ to the left of $-3$, solve $\\tan(\\theta_z) = \\frac{3}{z - 3} = \\frac{1}{2}$ for exact $z$.',
        highlightLatex:
          '\\tan(\\theta_z) = \\frac{\\textcolor{#22D3EE}{3}}{\\textcolor{#F59E0B}{z} - 3} = \\textcolor{#34D399}{\\frac{1}{2}}',
        options: [
          {
            id: 'a',
            latex: 'z = 6 \\;\\;(\\text{zero at } s = -6)',
            correct: false,
            misconception:
              '$6$ is the horizontal leg $(z - 3)$; add $3$ to get the zero coordinate from the origin: $z = 3 + 6 = 9$.',
          },
          {
            id: 'b',
            latex: 'z = 4.5 \\;\\;(\\text{zero at } s = -4.5)',
            correct: false,
            misconception:
              'Solving $\\frac{3}{z - 3} = 0.5$ gives $z - 3 = 3 / 0.5 = 6$ (not $3 \\times 0.5 = 1.5$).',
          },
          {
            id: 'c',
            latex: 'z = 9 \\;\\;(\\text{zero at } s = -9)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'z = -3 \\;\\;(\\text{zero at } s = +3)',
            correct: false,
            misconception:
              'A zero at $+3$ would be a non-minimum-phase RHP zero; since $\\theta_z < 90^\\circ$, the zero sits strictly to the LEFT of $-3$ at $s = -9$.',
          },
        ],
        lockedLabel: 'Exact Zero z',
        lockedResultLatex: 'z = \\textcolor{#34D399}{9} \\;\\;(\\text{zero at } s = -9)',
        hint: 'Cross-multiply $\\frac{3}{z - 3} = \\frac{1}{2} \\implies z - 3 = 6$.',
      },
      {
        stepType: 'mag_condition',
        badge: 'Exact Gain K via Magnitude',
        whyThisStep:
          'Once the angle condition puts $s_d$ on the locus, the magnitude condition $|L(s_d)| = 1$ gives the UNIQUE scalar gain $K$ that pins the closed-loop poles right onto $s_d$.',
        systemImpact:
          'With $K = 2$, $C(s) = 2(s+9) = 2s + 18$: verify algebraically that $s(s+4) + 2(s+9) = s^2 + 6s + 18 = (s+3)^2 + 9 = 0 \\implies s = -3 \\pm 3j$ EXACTLY!',
        prompt:
          'Apply the magnitude condition $K = \\frac{|s_d|\\,|s_d + 4|}{|s_d + 9|}$ at $s_d = -3 + 3j$ to find the exact integer gain $K$.',
        highlightLatex:
          'K = \\frac{|\\textcolor{#22D3EE}{-3+3j}|\\,|\\textcolor{#22D3EE}{1+3j}|}{|\\textcolor{#F59E0B}{6+3j}|} = \\frac{(3\\sqrt{2})(\\sqrt{10})}{\\sqrt{45}}',
        options: [
          {
            id: 'a',
            latex: 'K = 2 \\;\\;(C(s) = 2s + 18)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'K = 6 \\;\\;(C(s) = 6s + 54)',
            correct: false,
            misconception:
              'Simplify $\\sqrt{45} = 3\\sqrt{5}$: the factors of $3$ cancel leaving $\\frac{\\sqrt{20}}{\\sqrt{5}} = \\sqrt{4} = 2$, not $6$.',
          },
          {
            id: 'c',
            latex: 'K = 4 \\;\\;(C(s) = 4s + 36)',
            correct: false,
            misconception:
              'Remember the square root: $\\sqrt{20/5} = \\sqrt{4} = 2$, not $4$.',
          },
          {
            id: 'd',
            latex: 'K = 0.5 \\;\\;(C(s) = 0.5s + 4.5)',
            correct: false,
            misconception:
              'The fraction is inverted — put pole distances in the numerator and zero distances in the denominator: $K = \\frac{\\prod|s_d - p_i|}{\\prod|s_d - z_j|}$.',
          },
        ],
        lockedLabel: 'Exact Gain K',
        lockedResultLatex: 'K = \\textcolor{#34D399}{2} \\;\\;(\\textcolor{#34D399}{C(s) = 2s + 18})',
        hint: 'Simplify $\\frac{3\\sqrt{2}\\cdot\\sqrt{10}}{3\\sqrt{5}} = \\frac{\\sqrt{20}}{\\sqrt{5}}$.',
      },
      {
        stepType: 'noise_tradeoff',
        badge: 'Zero Location & HF Noise Limit',
        whyThisStep:
          'Moving from pure textbook PD to hardware implementation means always checking two physical realities: zero-induced overshoot and high-frequency sensor noise.',
        systemImpact:
          'Because $z = -9$ sits $3\\times$ farther left than $\\sigma = -3$, zero kick stays mild (~9% OS instead of ~25%), while appending a fast filter pole (e.g. $p \\approx -50$) turns ideal PD into a real noise-safe lead compensator!',
        prompt:
          'Evaluate the practical hardware behavior of $C(s) = 2(s + 9)$ with zero at $s = -9$ versus the dominant poles at $s = -3 \\pm 3j$.',
        highlightLatex:
          '|z| = 9 = \\textcolor{#34D399}{3}\\,|\\sigma|, \\qquad \\lim_{\\omega\\to\\infty}|C(j\\omega)| = \\textcolor{#F59E0B}{\\infty}',
        options: [
          {
            id: 'a',
            latex: '\\text{Ideal PD attenuates high-frequency encoder noise automatically}',
            correct: false,
            misconception:
              'Pure derivative gain $|2(j\\omega+9)|$ grows UNBOUNDED as $\\omega \\to \\infty$, violently amplifying encoder quantization noise!',
          },
          {
            id: 'b',
            latex: '\\text{Zero at }-9\\text{ destabilizes the loop if } K > 2',
            correct: false,
            misconception:
              'With $2$ poles and $1$ LHP zero ($n-m=1$), the single asymptote goes along $180^\\circ$ to $-\\infty$, so the loop stays stable for ALL $K > 0$!',
          },
          {
            id: 'c',
            latex: '\\text{Modest zero kick; needs HF roll-off pole for sensor noise}',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{Zero at }-9\\text{ cancels the open-loop integrator } 1/s',
            correct: false,
            misconception:
              'The integrator at $s=0$ stays intact, so the servo retains zero steady-state step error ($T(0) = 18/18 = 1$).',
          },
        ],
        lockedLabel: 'Hardware Reality',
        lockedResultLatex:
          '\\textcolor{#34D399}{\\text{Modest zero kick (}|z|=3\\sigma\\text{); add HF pole to bound sensor noise}}',
        hint: 'Compare $|z| = 9$ to $|\\sigma| = 3$, and check $|C(j\\omega)|$ as $\\omega \\to \\infty$.',
      },
    ],
  },

  {
    id: 'frq1-rl-circle',
    tier: 'root-locus',
    tierLabel: 'Root Locus',
    title: 'Circular Root Locus of Double Integrator + Zero',
    mechatronicsContext:
      'Stabilizing a frictionless reaction-wheel spacecraft ($1/s^2$) with a PD zero creates an exact circle on the $s$-plane centered at the zero, giving you direct geometric control over damping from $\\zeta = 0$ to $\\zeta = 1$.',
    expressionLatex: 'L(s)=\\frac{K(s+2)}{s^2} \\;\\;(\\text{Circle Locus})',
    finalAnswerLatex:
      '(\\sigma+2)^2 + \\omega^2 = 2^2, \\quad s_{\\text{in}}=-4\\;(K=8), \\quad s_{\\zeta=0.707}=-2\\pm 2j\\;(K=4)',
    verifyPlot: {
      kind: 'pole-map',
      bounds: { minRe: -6.5, maxRe: 1.0, minIm: -3.2, maxIm: 3.2 },
      circleLocus: { centerRe: -2, radius: 2, realSeg: [-6.5, -2], kMin: 0.2, kMax: 12 },
      defaultCursor: 0.322,
      subtitle:
        'Hover or drag horizontally to sweep gain $K \\in [0.2, 12]$: watch the poles orbit the exact circle centered at $z=-2$ (radius $2$), hit maximum damping angle ($45^\\circ$, $\\zeta=0.707$) at $K=4$, and break in at $s=-4$ ($K=8$)!',
      domainMeta: 'Interactive Circular Root Locus · Drag K ∈ [0.2, 12] · R = 2',
      metrics: [
        { label: 'Circle Center & R', value: 'Center (−2,0), R = 2' },
        { label: 'Break-In Point', value: 's = −4 (K = 8, ζ = 1)' },
        { label: 'ζ = 0.707 Point', value: 's = −2 ± 2j (top/bot)' },
        { label: 'Gain for ζ=0.707', value: 'K = 4.0 ✓' },
      ],
    },
    steps: [
      {
        stepType: 'real_segment',
        badge: 'Real-Axis Segment (Double Pole!)',
        whyThisStep:
          'Multiplicity matters in the odd-count rule: a double pole at the origin counts as TWO poles, completely changing which real intervals host closed-loop roots.',
        systemImpact:
          'Because $(-2, 0)$ is excluded, the two poles at $s = 0$ immediately depart vertically into the LHP for any $K > 0$, instantly stabilizing the spacecraft!',
        prompt:
          'Apply the real-axis odd-count rule to $L(s) = \\frac{K(s+2)}{s^2}$ (double pole at $s=0$, single zero at $s=-2$).',
        highlightLatex:
          '\\text{2 poles at } \\textcolor{#22D3EE}{s=0}, \\quad \\text{1 zero at } \\textcolor{#F59E0B}{s=-2}',
        options: [
          {
            id: 'a',
            latex: '(-2,\\,0)',
            correct: false,
            misconception:
              'Between $-2$ and $0$, there are TWO poles at $s = 0$ to the right — $2$ is EVEN, so $(-2, 0)$ is NOT on the locus!',
          },
          {
            id: 'b',
            latex: '(-\\infty,\\,-2)',
            correct: true,
          },
          {
            id: 'c',
            latex: '(-\\infty,\\,0)',
            correct: false,
            misconception:
              'The segment $(-2, 0)$ has an even count ($2$) to its right; only $(-\\infty, -2)$ has an odd count ($2 + 1 = 3$).',
          },
          {
            id: 'd',
            latex: '(-\\infty,\\,-4)',
            correct: false,
            misconception:
              'The entire ray left of the zero $s = -2$ has $3$ poles/zeros to its right, so the real-axis locus starts at $-2$ (one branch heads to $-2$, the other to $-\\infty$).',
          },
        ],
        lockedLabel: 'Real Segment',
        lockedResultLatex: '\\textcolor{#34D399}{(-\\infty,\\,-2)} \\;\\;(\\text{count}=3\\text{ odd})',
        hint: 'Count the double pole at $s=0$ with multiplicity $2$!',
      },
      {
        stepType: 'break_in',
        badge: 'Exact Break-In Point',
        whyThisStep:
          'Finding where the complex conjugate branches re-enter the negative real axis reveals the exact critical-damping boundary of the circular locus.',
        systemImpact:
          'At $s = -4$, the two branches collide back onto the real axis; for higher gains, one pole glides right toward the zero at $-2$ while the other accelerates left toward $-\\infty$.',
        prompt:
          'Write $K(s) = -\\frac{s^2}{s+2}$ from $s^2 + K(s+2) = 0$ and solve $\\frac{dK}{ds} = 0$ for the non-zero break-in point.',
        highlightLatex:
          '\\frac{d}{ds}\\!\\left(\\frac{\\textcolor{#22D3EE}{s^2}}{\\textcolor{#F59E0B}{s+2}}\\right) = \\frac{2s(s+2) - s^2}{(s+2)^2} = 0',
        options: [
          {
            id: 'a',
            latex: 's = -2 \\;\\;(\\text{at the zero})',
            correct: false,
            misconception:
              'At $s = -2$, $K \\to \\infty$ (a pole terminates there as $K \\to \\infty$); the break-in occurs strictly to the left of the zero.',
          },
          {
            id: 'b',
            latex: 's = -4 \\;\\;(\\text{break-in point})',
            correct: true,
          },
          {
            id: 'c',
            latex: 's = -1 \\;\\;(\\text{break-in point})',
            correct: false,
            misconception:
              'Simplify the numerator: $2s(s+2) - s^2 = s^2 + 4s = s(s+4) = 0$, giving $s = 0$ and $s = -4$.',
          },
          {
            id: 'd',
            latex: 's = -8 \\;\\;(\\text{break-in point})',
            correct: false,
            misconception:
              'Solving $s(s+4) = 0$ yields $s = -4$ (while $K = 8$ is the gain AT that break-in point!).',
          },
        ],
        lockedLabel: 'Break-In Point',
        lockedResultLatex: 's_{\\text{in}} = \\textcolor{#34D399}{-4}',
        hint: 'Simplify $2s(s+2) - s^2 = s(s + 4) = 0$.',
      },
      {
        stepType: 'circle_geom',
        badge: 'Exact Circular Locus Equation',
        whyThisStep:
          'Whenever a system has 2 poles and 1 finite zero outside them, the complex locus is a perfect circle centered on the zero — letting you read off optimal damping by pure compass geometry.',
        systemImpact:
          'Because the circle passes through $s = 0$ (breakaway) and $s = -4$ (break-in), its diameter is $4$, centering it at the zero $(-2, 0)$ with radius $R = 2$!',
        prompt:
          'From the complex roots of $s^2 + Ks + 2K = 0$ (with breakaway at $0$ and break-in at $-4$), identify the exact circular equation in the $(\\sigma, \\omega)$ plane.',
        highlightLatex:
          '\\sigma = -\\frac{K}{2}, \\quad \\omega^2 = 2K - \\frac{K^2}{4} \\implies (\\sigma + \\textcolor{#F59E0B}{2})^2 + \\omega^2 = \\textcolor{#34D399}{R^2}',
        options: [
          {
            id: 'a',
            latex: '(\\sigma + 2)^2 + \\omega^2 = 2^2 \\;\\;(\\text{center }-2,\\; R=2)',
            correct: true,
          },
          {
            id: 'b',
            latex: '(\\sigma + 2)^2 + \\omega^2 = 4^2 \\;\\;(\\text{center }-2,\\; R=4)',
            correct: false,
            misconception:
              'The distance from center $(-2, 0)$ to $s = 0$ (or $s = -4$) is $R = 2$ (diameter $= 4$), so $R^2 = 4 = 2^2$.',
          },
          {
            id: 'c',
            latex: '(\\sigma + 4)^2 + \\omega^2 = 4^2 \\;\\;(\\text{center }-4,\\; R=4)',
            correct: false,
            misconception:
              'The circle is centered at the ZERO $(-2, 0)$, not at the break-in point $(-4, 0)$.',
          },
          {
            id: 'd',
            latex: '\\sigma^2 + \\omega^2 = 2^2 \\;\\;(\\text{center }0,\\; R=2)',
            correct: false,
            misconception:
              'A circle centered at the origin would extend into the unstable RHP; here the entire circle sits inside the LHP tangent to the $j\\omega$-axis at $s = 0$.',
          },
        ],
        lockedLabel: 'Circle Geometry',
        lockedResultLatex: '\\textcolor{#34D399}{(\\sigma + 2)^2 + \\omega^2 = 2^2} \\;\\;(\\text{center }-2,\\; R=2)',
        hint: 'Expand $(-K/2 + 2)^2 + (2K - K^2/4)$ and watch every $K$ term cancel!',
      },
      {
        stepType: 'critical_gain',
        badge: 'Gain at Critical Break-In',
        whyThisStep:
          'Computing the gain at $s = -4$ establishes the exact threshold above which the spacecraft stops oscillating and transitions to overdamped real poles.',
        systemImpact:
          'At $K = 8$, the closed-loop denominator becomes $(s+4)^2$: both poles sit at $-4$ with $\\zeta = 1.0$, giving crisp $T_s \\approx 1.0\\text{ s}$ settling.',
        prompt:
          'Evaluate the magnitude condition $K = \\frac{|s|^2}{|s + 2|}$ at the break-in point $s = -4$.',
        highlightLatex:
          'K = \\frac{|\\textcolor{#22D3EE}{-4}|^2}{|\\textcolor{#22D3EE}{-4} + \\textcolor{#F59E0B}{2}|}',
        options: [
          {
            id: 'a',
            latex: 'K = 4 \\;\\;(\\text{double pole at } s = -4)',
            correct: false,
            misconception:
              'Check the numerator: $(-4)^2 = 16$, divided by $|-4+2| = 2$ gives $K = 8$.',
          },
          {
            id: 'b',
            latex: 'K = 16 \\;\\;(\\text{double pole at } s = -4)',
            correct: false,
            misconception:
              'Remember to divide by the zero distance $|s + 2| = |-4 + 2| = 2$: $16/2 = 8$.',
          },
          {
            id: 'c',
            latex: 'K = 8 \\;\\;(\\text{double pole at } s = -4)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'K = 2 \\;\\;(\\text{double pole at } s = -4)',
            correct: false,
            misconception:
              'Verify in $s^2 + Ks + 2K = 0$: $(s+4)^2 = s^2 + 8s + 16$ requires $K = 8$.',
          },
        ],
        lockedLabel: 'Break-In Gain',
        lockedResultLatex: 'K_{\\text{crit}} = \\textcolor{#34D399}{8} \\;\\;(\\textcolor{#34D399}{s = -4,\\; -4})',
        hint: 'Compute $16 / 2$, or match $s^2 + Ks + 2K = (s+4)^2$.',
      },
      {
        stepType: 'zeta_0707_gain',
        badge: 'Gain for ζ = 0.707 on Circle',
        whyThisStep:
          'Intersecting the circular locus with the $45^\\circ$ Butterworth damping ray shows how cleanly geometry solves damping design without trial-and-error.',
        systemImpact:
          'At $K = 4$, the poles sit at the exact top and bottom apexes of the circle ($s = -2 \\pm 2j$): $\\zeta = 0.707$ with HALF the gain (and half the sensor noise!) of critical damping!',
        prompt:
          'Find where the circle $(\\sigma + 2)^2 + \\omega^2 = 4$ intersects the $45^\\circ$ ray ($\\omega = -\\sigma$, $\\zeta = 0.707$) and solve for $K$.',
        highlightLatex:
          '(\\sigma + 2)^2 + (-\\sigma)^2 = 4 \\implies s = \\textcolor{#34D399}{-2 \\pm 2j}, \\quad s^2 + \\textcolor{#F59E0B}{K}s + 2\\textcolor{#F59E0B}{K} = 0',
        options: [
          {
            id: 'a',
            latex: 's = -2 \\pm 2j, \\qquad K = 4',
            correct: true,
          },
          {
            id: 'b',
            latex: 's = -2 \\pm 2j, \\qquad K = 8',
            correct: false,
            misconception:
              'Expand $(s+2)^2 + 4 = s^2 + 4s + 8$: matching $s^2 + Ks + 2K$ gives $K = 4$ (while $K=8$ is the break-in at $-4$).',
          },
          {
            id: 'c',
            latex: 's = -1 \\pm j, \\qquad K = 2',
            correct: false,
            misconception:
              'Test $(-1, 1)$ on the circle: $(-1+2)^2 + 1^2 = 2 \\neq 4$; $(-1, 1)$ is strictly INSIDE the circle, not on the locus!',
          },
          {
            id: 'd',
            latex: 's = -2 \\pm 2j, \\qquad K = 2',
            correct: false,
            misconception:
              'At $K = 2$, $s^2 + 2s + 4 = 0$ gives $s = -1 \\pm \\sqrt{3}\\,j$ ($\\zeta = 0.5$); $\\zeta = 0.707$ requires $K = 4$.',
          },
        ],
        lockedLabel: 'Butterworth Gain',
        lockedResultLatex: 's = \\textcolor{#34D399}{-2 \\pm 2j}, \\qquad K = \\textcolor{#34D399}{4}',
        hint: 'Match $(s+2)^2 + 2^2 = s^2 + 4s + 8$ directly to $s^2 + Ks + 2K$.',
      },
    ],
  },

  // =========================================================================
  // TIER 2: BODE ASYMPTOTES, RESONANCE & EXACT MARGINS (3 problems)
  // =========================================================================
  {
    id: 'frq2-bode-corners',
    tier: 'bode-freq',
    tierLabel: 'Bode & Resonance',
    title: 'Bode Asymptotes, Corner Transitions & Phase Peak',
    mechatronicsContext:
      'Reading Bode slopes and corner frequencies by inspection lets a controls engineer diagnose loop type, mid-band phase boost, and stability margins straight from a transfer function on the whiteboard.',
    expressionLatex: 'G(s)=\\frac{20(s+2)}{s(s+10)} \\;\\;(\\text{Bode})',
    finalAnswerLatex:
      'G(s)=\\frac{4(1+s/2)}{s(1+s/10)}, \\quad \\angle G(j\\sqrt{20})\\approx -48.2^\\circ \\;\\;(\\text{uncond. stable})',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.2,
      wMax: 60,
      magMin: -20,
      magMax: 32,
      phMin: -190,
      phMax: -30,
      wGc: 17.47,
      pmDeg: 113.3,
      magDbFn: (w) => 20 * Math.log10((20 * Math.hypot(w, 2)) / (w * Math.hypot(w, 10))),
      phaseDegFn: (w) => -90 + (Math.atan(w / 2) - Math.atan(w / 10)) * (180 / Math.PI),
      defaultCursor: 0.54,
      subtitle:
        'Hover or drag across $\\omega$: watch the magnitude slope flatten from $-20$ to $0\\text{ dB/dec}$ on $[2, 10]$ while phase rises to a peak of $-48.2^\\circ$ at $\\omega = \\sqrt{20} \\approx 4.47$, staying far above $-180^\\circ$ everywhere!',
      domainMeta: 'Bode Plot · Zero ω=2, Pole ω=10 · Phase Peak −48.2°',
      metrics: [
        { label: 'Bode Gain KB', value: '4.0 (+12.0 dB at ω=1)' },
        { label: 'Slopes (dB/dec)', value: '−20 → 0 → −20' },
        { label: 'Peak Phase', value: '−48.2° at ω=√20' },
        { label: 'Stability Margin', value: 'PM = 113.3° (All K>0) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'bode_std_form',
        badge: 'Bode Time-Constant Form',
        whyThisStep:
          'Normalizing every factor to $(1 + s/\\omega_c)$ separates DC/low-frequency gain cleanly from corner transitions so each term contributes $0\\text{ dB}$ below its corner.',
        systemImpact:
          'Pulling out $2/10 = 0.2$ drops the apparent gain from $20$ to the true velocity constant $K_v = 4$ — the exact low-frequency asymptote height!',
        prompt:
          'Factor the constants out of $(s + 2)$ and $(s + 10)$ to rewrite $G(s) = \\frac{20(s+2)}{s(s+10)}$ in standard Bode form $K_B\\frac{1 + s/\\omega_z}{s(1 + s/\\omega_p)}$.',
        highlightLatex:
          'G(s) = \\frac{20 \\cdot \\textcolor{#22D3EE}{2}\\,(1 + s/2)}{\\textcolor{#F59E0B}{10}\\,s\\,(1 + s/10)}',
        options: [
          {
            id: 'a',
            latex: 'G(s) = \\frac{20(1 + s/2)}{s(1 + s/10)}',
            correct: false,
            misconception:
              'Factoring $2$ from $(s+2)$ and $10$ from $(s+10)$ multiplies the leading gain by $2/10$: $20 \\cdot \\frac{2}{10} = 4$, not $20$.',
          },
          {
            id: 'b',
            latex: 'G(s) = \\frac{4(1 + s/2)}{s(1 + s/10)}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'G(s) = \\frac{100(1 + s/2)}{s(1 + s/10)}',
            correct: false,
            misconception:
              'Divide by $10$ and multiply by $2$ ($20\\cdot 2/10 = 4$), rather than multiplying by $10/2$.',
          },
          {
            id: 'd',
            latex: 'G(s) = \\frac{4(1 + 2s)}{s(1 + 10s)}',
            correct: false,
            misconception:
              'In $(1 + s/\\omega_c)$, divide $s$ by the corner frequency ($s/2$ and $s/10$), not multiply by it.',
          },
        ],
        lockedLabel: 'Bode Form',
        lockedResultLatex: 'G(s) = \\textcolor{#34D399}{\\frac{4(1 + s/2)}{s(1 + s/10)}}',
        hint: 'Simplify $\\frac{20 \\times 2}{10} = 4$ while writing $(s+a) = a(1 + s/a)$.',
      },
      {
        stepType: 'low_freq_asymp',
        badge: 'Low-Freq Slope & ω=1 dB',
        whyThisStep:
          'The low-frequency asymptote anchors the entire Bode magnitude sketch in decibels and directly tells you the system\'s Type number and ramp-tracking constant $K_v$.',
        systemImpact:
          'At $\\omega = 1$, the $-20\\text{ dB/dec}$ integrator line passes through $+12.0\\text{ dB}$ ($K_v = 4$), guaranteeing $0$ step error and $0.25$ steady ramp lag.',
        prompt:
          'For $\\omega \\ll 2$, $G(j\\omega) \\approx \\frac{4}{j\\omega}$. Find the low-frequency slope (dB/dec) and exact dB value of this asymptote at $\\omega = 1\\text{ rad/s}$.',
        highlightLatex:
          '|G(j\\omega)|_{\\text{dB}} \\approx 20\\log_{10}\\!\\left(\\frac{\\textcolor{#F59E0B}{4}}{\\textcolor{#22D3EE}{\\omega}}\\right) \\qquad (\\omega \\ll 2)',
        options: [
          {
            id: 'a',
            latex: '-20\\text{ dB/dec}, \\qquad +12.0\\text{ dB at } \\omega = 1',
            correct: true,
          },
          {
            id: 'b',
            latex: '-20\\text{ dB/dec}, \\qquad +4.0\\text{ dB at } \\omega = 1',
            correct: false,
            misconception:
              'Convert linear gain $4$ to decibels: $20\\log_{10}(4) = 40\\log_{10}(2) \\approx 40(0.301) = +12.04\\text{ dB}$ (not $+4\\text{ dB}$).',
          },
          {
            id: 'c',
            latex: '0\\text{ dB/dec}, \\qquad +12.0\\text{ dB at } \\omega = 1',
            correct: false,
            misconception:
              'The free integrator $1/s$ gives a $-20\\text{ dB/dec}$ slope at low frequency (only Type-0 plants are flat at $0\\text{ dB/dec}$).',
          },
          {
            id: 'd',
            latex: '-40\\text{ dB/dec}, \\qquad +26.0\\text{ dB at } \\omega = 1',
            correct: false,
            misconception:
              'There is only ONE pole at the origin ($1/s$, $-20\\text{ dB/dec}$), and $K_B = 4$ (not $20$, which would be $+26\\text{ dB}$).',
          },
        ],
        lockedLabel: 'Low-Freq Line',
        lockedResultLatex: '\\textcolor{#34D399}{-20\\text{ dB/dec},\\;\\; +12.0\\text{ dB at } \\omega = 1}',
        hint: 'Use the handy rule $20\\log_{10}(2) \\approx 6.02\\text{ dB}$, so $20\\log_{10}(4) \\approx 12.04\\text{ dB}$.',
      },
      {
        stepType: 'slope_transitions',
        badge: 'Slope Transitions at Corners',
        whyThisStep:
          'Tracking how each zero adds $+20\\text{ dB/dec}$ and each pole subtracts $-20\\text{ dB/dec}$ lets you sketch the entire frequency response in seconds.',
        systemImpact:
          'The zero at $\\omega = 2$ arrests the drop into a flat $0\\text{ dB/dec}$ shelf on $[2, 10]$ before the pole at $\\omega = 10$ resumes $-20\\text{ dB/dec}$ — creating a gentle $-20\\text{ dB/dec}$ crossover!',
        prompt:
          'Track the asymptotic Bode magnitude slope across the zero corner $\\omega_z = 2$ and pole corner $\\omega_p = 10$.',
        highlightLatex:
          '\\omega < 2 \\;\\xrightarrow{\\text{zero }\\textcolor{#34D399}{+20}}\\; 2 < \\omega < 10 \\;\\xrightarrow{\\text{pole }\\textcolor{#F59E0B}{-20}}\\; \\omega > 10',
        options: [
          {
            id: 'a',
            latex: '-20 \\xrightarrow{\\omega=2} -40 \\xrightarrow{\\omega=10} -20\\text{ dB/dec}',
            correct: false,
            misconception:
              'A ZERO at $\\omega=2$ bends the slope UPWARD ($+20\\text{ dB/dec}$: $-20 + 20 = 0$), whereas a POLE bends it downward ($-20$).',
          },
          {
            id: 'b',
            latex: '-20 \\xrightarrow{\\omega=2} 0 \\xrightarrow{\\omega=10} -20\\text{ dB/dec}',
            correct: true,
          },
          {
            id: 'c',
            latex: '0 \\xrightarrow{\\omega=2} +20 \\xrightarrow{\\omega=10} 0\\text{ dB/dec}',
            correct: false,
            misconception:
              'Don\'t forget the initial $-20\\text{ dB/dec}$ slope from the integrator $1/s$ for $\\omega < 2$.',
          },
          {
            id: 'd',
            latex: '-20 \\xrightarrow{\\omega=2} 0 \\xrightarrow{\\omega=10} -40\\text{ dB/dec}',
            correct: false,
            misconception:
              'There is only a single pole at $\\omega = 10$, subtracting $20\\text{ dB/dec}$ from $0$ down to $-20\\text{ dB/dec}$.',
          },
        ],
        lockedLabel: 'Slope Profile',
        lockedResultLatex: '\\textcolor{#34D399}{-20 \\xrightarrow{\\omega=2} 0 \\xrightarrow{\\omega=10} -20\\text{ dB/dec}}',
        hint: 'Start at $-20$, add $+20$ at the zero $\\omega=2$, then subtract $-20$ at the pole $\\omega=10$.',
      },
      {
        stepType: 'midpoint_phase',
        badge: 'Exact Phase at Geometric Midpoint',
        whyThisStep:
          'A zero-pole pair $(1+s/2)/(1+s/10)$ IS a built-in phase-lead dipole whose phase boost peaks cleanly at the geometric mean $\\omega_m = \\sqrt{\\omega_z\\omega_p}$.',
        systemImpact:
          'At $\\omega_m = \\sqrt{20} \\approx 4.47\\text{ rad/s}$, the dipole injects $+41.8^\\circ$ of phase lead, lifting total phase from $-90^\\circ$ all the way up to $-48.2^\\circ$!',
        prompt:
          'Compute the exact phase $\\angle G(j\\omega)$ at the geometric midpoint $\\omega_m = \\sqrt{2 \\cdot 10} = \\sqrt{20} \\approx 4.47\\text{ rad/s}$.',
        highlightLatex:
          '\\angle G(j\\sqrt{20}) = -90^\\circ + \\arctan\\!\\left(\\textcolor{#34D399}{\\sqrt{5}}\\right) - \\arctan\\!\\left(\\textcolor{#F59E0B}{\\tfrac{1}{\\sqrt{5}}}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\angle G(j\\sqrt{20}) \\approx -131.8^\\circ',
            correct: false,
            misconception:
              'The ZERO comes first ($\\omega_z = 2 < \\omega_p = 10$), so it ADDS positive phase lead ($+41.8^\\circ$): $-90^\\circ + 41.8^\\circ = -48.2^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\angle G(j\\sqrt{20}) = -90^\\circ',
            correct: false,
            misconception:
              'The zero and pole phases only cancel at $\\omega \\to 0$ and $\\omega \\to \\infty$; at $\\sqrt{20}$ their difference is maximal ($+41.8^\\circ$)!',
          },
          {
            id: 'c',
            latex: '\\angle G(j\\sqrt{20}) \\approx -48.2^\\circ',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\angle G(j\\sqrt{20}) \\approx +41.8^\\circ',
            correct: false,
            misconception:
              'Remember to include the integrator\'s constant $-90^\\circ$ phase baseline: $-90^\\circ + 41.8^\\circ = -48.2^\\circ$.',
          },
        ],
        lockedLabel: 'Midpoint Phase',
        lockedResultLatex: '\\angle G(j\\sqrt{20}) = \\textcolor{#34D399}{-48.2^\\circ} \\;\\;(+41.8^\\circ\\text{ lead boost})',
        hint: 'Use $\\arctan(\\sqrt{5}) \\approx 65.9^\\circ$ and $\\arctan(1/\\sqrt{5}) \\approx 24.1^\\circ$ (or $\\arcsin\\frac{5-1}{5+1} = \\arcsin\\frac{2}{3} \\approx 41.8^\\circ$).',
      },
      {
        stepType: 'uncond_stable',
        badge: 'Unconditional Stability Proof',
        whyThisStep:
          'Bounding the worst-case phase across ALL frequencies $\\omega \\in (0, \\infty)$ lets you prove unconditional closed-loop stability at a glance without ever computing a gain crossover.',
        systemImpact:
          'Because $\\angle G(j\\omega) \\in [-90^\\circ, -48.2^\\circ]$ for ALL $\\omega > 0$, Phase Margin stays strictly above $90^\\circ$ and Gain Margin is $\\infty$ — no proportional gain $K > 0$ can destabilize this ideal loop!',
        prompt:
          'Check the minimum phase of $G(j\\omega)$ over all $\\omega \\in (0, \\infty)$ and conclude what happens to closed-loop stability as proportional gain $K > 0$ increases arbitrarily.',
        highlightLatex:
          '-90^\\circ \\le \\angle G(j\\omega) \\le -48.2^\\circ \\qquad \\forall\\,\\omega > 0',
        options: [
          {
            id: 'a',
            latex: '\\text{Unstable for high } K \\text{ because of the } 1/s \\text{ integrator}',
            correct: false,
            misconception:
              'A single integrator adds only $-90^\\circ$; without extra lag exceeding $-90^\\circ$, the phase can NEVER reach $-180^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\angle G > -90^\\circ\\;\\forall\\omega \\implies \\text{unconditionally stable } (\\text{GM}=\\infty)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Marginally stable since phase approaches } -180^\\circ \\text{ as } \\omega\\to\\infty',
            correct: false,
            misconception:
              'With $2$ poles and $1$ zero ($n - m = 1$), the high-frequency phase asymptote is $-90^\\circ(n-m) = -90^\\circ$, NOT $-180^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\text{Stable only if } \\omega_{gc} \\in [2, 10]',
            correct: false,
            misconception:
              'Even outside $[2, 10]$ (e.g. at actual $\\omega_{gc} = 17.5$), phase is $-66.7^\\circ$ ($\\text{PM} = 113.3^\\circ$), safely stable for every $K > 0$.',
          },
        ],
        lockedLabel: 'Global Stability',
        lockedResultLatex: '\\textcolor{#34D399}{\\angle G \\ge -90^\\circ\\;\\forall\\omega \\implies \\text{Unconditionally Stable (GM}=\\infty\\text{)}}',
        hint: 'Check whether $\\angle G(j\\omega)$ can ever reach $-180^\\circ$ when $n - m = 1$.',
      },
    ],
  },

  {
    id: 'frq2-resonance-bw',
    tier: 'bode-freq',
    tierLabel: 'Bode & Resonance',
    title: 'Resonant Peak Mr & Closed-Loop Bandwidth',
    mechatronicsContext:
      'A lightly damped robotic arm or optical mirror mount strongly amplifies external vibrations near its resonant peak $M_r$; translating time-domain $\\zeta$ into frequency-domain $M_r$ lets you spot structural ringing immediately on a sine sweep.',
    expressionLatex: 'T(s)=\\frac{100}{s^2+4s+100} \\;\\;(\\text{Resonance})',
    finalAnswerLatex:
      '\\omega_n=10,\\; \\zeta=0.2 \\implies \\omega_r\\approx 9.59\\text{ rad/s},\\; M_r\\approx 2.55\\;(+8.1\\text{ dB})',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 1,
      wMax: 50,
      magMin: -28,
      magMax: 14,
      phMin: -195,
      phMax: 10,
      wGc: 9.59,
      hidePmBracket: true,
      peakMarker: { w: 9.59, db: 8.14, label: 'Mr=+8.1dB (ωr=9.59)' },
      magDbFn: (w) => 20 * Math.log10(100 / Math.hypot(100 - w * w, 4 * w)),
      phaseDegFn: (w) => -Math.atan2(4 * w, 100 - w * w) * (180 / Math.PI),
      defaultCursor: 0.58,
      subtitle:
        'Hover or drag across $\\omega$: at $\\omega_r = 9.59\\text{ rad/s}$ (just below $\\omega_n = 10$), $|T(j\\omega)|$ spikes to $+8.1\\text{ dB}$ ($2.55\\times$ amplification) while phase plunges sharply through $-90^\\circ$.',
      domainMeta: 'Closed-Loop Resonance · ζ = 0.2 · Mr = +8.1 dB at ωr = 9.59',
      metrics: [
        { label: 'Natural (ωn, ζ)', value: '10 rad/s, 0.20' },
        { label: 'Resonant ωr', value: '10√0.92 ≈ 9.59 rad/s' },
        { label: 'Peak Mr', value: '2.55 (+8.1 dB!)' },
        { label: 'Zero-Peak Limit', value: 'ζ ≥ 0.707 (Mr = 1) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'id_wn_zeta',
        badge: 'Extract ωn & ζ',
        whyThisStep:
          'For a unity-DC-gain second-order closed loop, $(\\omega_n, \\zeta)$ completely determines both step overshoot AND frequency-domain resonant peaking.',
        systemImpact:
          'With $\\zeta = 0.2$, the loop is very lightly damped (~53% step overshoot!) and will strongly amplify sinusoidal inputs near $10\\text{ rad/s}$.',
        prompt:
          'Match $T(s) = \\frac{100}{s^2 + 4s + 100}$ to canonical form $\\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$ to extract $\\omega_n$ and $\\zeta$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{\\omega_n}^2 = 100, \\qquad 2\\textcolor{#F59E0B}{\\zeta}\\textcolor{#22D3EE}{\\omega_n} = 4',
        options: [
          {
            id: 'a',
            latex: '\\omega_n = 10\\text{ rad/s}, \\qquad \\zeta = 0.4',
            correct: false,
            misconception:
              'Include the factor of $2$ in $2\\zeta\\omega_n = 4$: $\\zeta = \\frac{4}{2\\cdot 10} = 0.2$, not $0.4$.',
          },
          {
            id: 'b',
            latex: '\\omega_n = 10\\text{ rad/s}, \\qquad \\zeta = 0.2',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\omega_n = 100\\text{ rad/s}, \\qquad \\zeta = 0.02',
            correct: false,
            misconception:
              'Take the square root of $100$: $\\omega_n = \\sqrt{100} = 10\\text{ rad/s}$.',
          },
          {
            id: 'd',
            latex: '\\omega_n = 10\\text{ rad/s}, \\qquad \\zeta = 0.5',
            correct: false,
            misconception:
              'Solve $20\\zeta = 4 \\implies \\zeta = 4/20 = 0.2$.',
          },
        ],
        lockedLabel: 'Loop Params',
        lockedResultLatex: '\\omega_n = \\textcolor{#34D399}{10\\text{ rad/s}}, \\qquad \\zeta = \\textcolor{#34D399}{0.2}',
        hint: 'Take $\\omega_n = \\sqrt{100} = 10$ and solve $2\\zeta(10) = 4$.',
      },
      {
        stepType: 'res_freq',
        badge: 'Exact Resonant Frequency ωr',
        whyThisStep:
          'Notice a subtle engineering fact: the Bode peak $\\omega_r$ is ALWAYS slightly LOWER than both $\\omega_n$ and the damped ringing frequency $\\omega_d$!',
        systemImpact:
          'Peak vibration hits at $\\omega_r = 9.59\\text{ rad/s}$ (not $10$), following the exact ordering $\\omega_r < \\omega_d < \\omega_n$ ($9.59 < 9.80 < 10.0$).',
        prompt:
          'Compute the exact resonant frequency $\\omega_r = \\omega_n\\sqrt{1 - 2\\zeta^2}$ for $\\omega_n = 10,\\; \\zeta = 0.2$.',
        highlightLatex:
          '\\omega_r = \\textcolor{#22D3EE}{10}\\sqrt{1 - 2(\\textcolor{#F59E0B}{0.2})^2}',
        options: [
          {
            id: 'a',
            latex: '\\omega_r = 10\\sqrt{0.96} \\approx 9.80\\text{ rad/s}',
            correct: false,
            misconception:
              '$\\omega_n\\sqrt{1 - \\zeta^2} = 9.80$ is the time-domain damped frequency $\\omega_d$; the frequency-domain resonant peak has a factor of $2$: $\\omega_n\\sqrt{1 - 2\\zeta^2}$.',
          },
          {
            id: 'b',
            latex: '\\omega_r = 10\\sqrt{0.92} \\approx 9.59\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\omega_r = 10\\text{ rad/s}',
            correct: false,
            misconception:
              '$\\omega_n = 10$ is where phase crosses $-90^\\circ$, but damping shifts the magnitude maximum slightly leftward to $10\\sqrt{1-2\\zeta^2}$.',
          },
          {
            id: 'd',
            latex: '\\omega_r = 10\\sqrt{0.60} \\approx 7.75\\text{ rad/s}',
            correct: false,
            misconception:
              'Square $\\zeta = 0.2$ first: $2\\zeta^2 = 2(0.04) = 0.08$ (not $2(0.2) = 0.40$), leaving $1 - 0.08 = 0.92$.',
          },
        ],
        lockedLabel: 'Resonant Freq ωr',
        lockedResultLatex: '\\omega_r = \\textcolor{#34D399}{10\\sqrt{0.92} \\approx 9.59\\text{ rad/s}}',
        hint: 'Evaluate $1 - 2(0.2)^2 = 1 - 0.08 = 0.92$.',
      },
      {
        stepType: 'res_peak',
        badge: 'Resonant Peak Mr & dB',
        whyThisStep:
          'Quantifying $M_r$ directly measures worst-case sinusoidal disturbance amplification — crucial for preventing structural fatigue or actuator saturation.',
        systemImpact:
          'With $M_r \\approx 2.55$ ($+8.1\\text{ dB}$), any vibration near $9.6\\text{ rad/s}$ is amplified over $2.5\\times$ instead of attenuated!',
        prompt:
          'Compute the resonant peak magnification $M_r = \\frac{1}{2\\zeta\\sqrt{1 - \\zeta^2}}$ and express it in decibels ($20\\log_{10} M_r$).',
        highlightLatex:
          'M_r = \\frac{1}{2(\\textcolor{#F59E0B}{0.2})\\sqrt{1 - (\\textcolor{#F59E0B}{0.2})^2}} = \\frac{1}{0.4\\sqrt{0.96}}',
        options: [
          {
            id: 'a',
            latex: 'M_r \\approx 2.55 \\;\\;(+8.1\\text{ dB})',
            correct: true,
          },
          {
            id: 'b',
            latex: 'M_r \\approx 5.00 \\;\\;(+14.0\\text{ dB})',
            correct: false,
            misconception:
              'Include the factor of $2$ in the denominator: $1/(2\\zeta) = 2.5$ (not $1/\\zeta = 5$), and dividing by $\\sqrt{0.96} \\approx 0.98$ nudges it to $2.55$.',
          },
          {
            id: 'c',
            latex: 'M_r \\approx 1.25 \\;\\;(+1.9\\text{ dB})',
            correct: false,
            misconception:
              'Check $1 / (0.4 \\times 0.9798) \\approx 2.55$, corresponding to $20\\log_{10}(2.55) \\approx +8.1\\text{ dB}$.',
          },
          {
            id: 'd',
            latex: 'M_r \\approx 2.55 \\;\\;(+4.1\\text{ dB})',
            correct: false,
            misconception:
              'Amplitude/voltage ratios use $20\\log_{10}(M_r) \\approx +8.1\\text{ dB}$ (not $10\\log_{10}$, which is for power).',
          },
        ],
        lockedLabel: 'Resonant Peak Mr',
        lockedResultLatex: 'M_r \\approx \\textcolor{#34D399}{2.55 \\;\\;(+8.1\\text{ dB})}',
        hint: 'Compute $1/(0.4\\sqrt{0.96}) \\approx 2.55$ and $20\\log_{10}(2.55) \\approx 8.1\\text{ dB}$.',
      },
      {
        stepType: 'dc_hf_rolloff',
        badge: 'DC Gain & High-Freq Roll-Off',
        whyThisStep:
          'A good closed-loop $T(s)$ must pass low-frequency commands at $0\\text{ dB}$ (accurate tracking) while rolling off steeply at high frequency to reject encoder noise.',
        systemImpact:
          'Flat $0\\text{ dB}$ DC tracking paired with a $-40\\text{ dB/dec}$ roll-off suppresses $100\\text{ rad/s}$ sensor noise by $100\\times$ ($-40\\text{ dB}$) — if you can tame the peak at $9.6\\text{ rad/s}$.',
        prompt:
          'Evaluate the DC magnitude $|T(0)|$ (in dB) and the high-frequency roll-off slope of $T(s) = \\frac{100}{s^2 + 4s + 100}$ for $\\omega \\gg 10\\text{ rad/s}$.',
        highlightLatex:
          '|T(0)| = \\frac{100}{100} = 1, \\qquad |T(j\\omega)| \\sim \\frac{100}{\\textcolor{#22D3EE}{\\omega^2}} \\;\\;(\\omega \\gg 10)',
        options: [
          {
            id: 'a',
            latex: '+40\\text{ dB at DC}, \\qquad -40\\text{ dB/dec for } \\omega \\gg 10',
            correct: false,
            misconception:
              'At $s = 0$, $T(0) = 100/100 = 1$, and $20\\log_{10}(1) = 0\\text{ dB}$ (not $+40\\text{ dB}$).',
          },
          {
            id: 'b',
            latex: '0\\text{ dB at DC}, \\qquad -20\\text{ dB/dec for } \\omega \\gg 10',
            correct: false,
            misconception:
              'Two poles and zero finite zeros ($n - m = 2$) roll off at $-20(2) = -40\\text{ dB/dec}$.',
          },
          {
            id: 'c',
            latex: '0\\text{ dB at DC}, \\qquad -40\\text{ dB/dec for } \\omega \\gg 10',
            correct: true,
          },
          {
            id: 'd',
            latex: '-3\\text{ dB at DC}, \\qquad -40\\text{ dB/dec for } \\omega \\gg 10',
            correct: false,
            misconception:
              '$-3\\text{ dB}$ defines the closed-loop BANDWIDTH frequency $\\omega_{BW}$; at DC ($\\omega = 0$), $|T(0)| = 1 = 0\\text{ dB}$.',
          },
        ],
        lockedLabel: 'DC & Roll-Off',
        lockedResultLatex: '\\textcolor{#34D399}{0\\text{ dB at DC}, \\quad -40\\text{ dB/dec for } \\omega \\gg 10}',
        hint: 'Check $20\\log_{10}(T(0))$ and multiply excess pole count $(n-m)$ by $-20\\text{ dB/dec}$.',
      },
      {
        stepType: 'elim_resonance',
        badge: 'Threshold to Eliminate Resonance',
        whyThisStep:
          'Knowing the exact $\\zeta$ threshold where resonant peaking vanishes explains why Butterworth filters and industrial servos standardize around maximally flat damping.',
        systemImpact:
          'Raising damping from $\\zeta = 0.2$ to $\\zeta \\ge 1/\\sqrt{2} \\approx 0.707$ drops $M_r$ from $+8.1\\text{ dB}$ cleanly down to $0\\text{ dB}$ ($M_r = 1$), eliminating all vibration amplification!',
        prompt:
          'From $\\omega_r = \\omega_n\\sqrt{1 - 2\\zeta^2}$, find the exact minimum damping ratio $\\zeta$ that completely eliminates the resonant peak ($M_r = 1$, monotonic magnitude roll-off).',
        highlightLatex:
          '1 - 2\\textcolor{#F59E0B}{\\zeta}^2 \\le 0 \\quad\\Longleftrightarrow\\quad \\text{no peak above } 0\\text{ dB}',
        options: [
          {
            id: 'a',
            latex: '\\zeta \\ge 1.0 \\;\\;(\\text{critically damped only})',
            correct: false,
            misconception:
              'The frequency peak disappears EARLIER than time-domain overshoot: for $0.707 \\le \\zeta < 1$, there is tiny step overshoot ($\\le 4.3\\%$) yet ZERO frequency-domain resonant peak!',
          },
          {
            id: 'b',
            latex: '\\zeta \\ge 0.5',
            correct: false,
            misconception:
              'At $\\zeta = 0.5$, $1 - 2(0.25) = 0.5 > 0$, still producing a $+1.25\\text{ dB}$ resonant bump ($M_r = 1.155$).',
          },
          {
            id: 'c',
            latex: '\\zeta \\ge \\frac{1}{\\sqrt{2}} \\approx 0.707 \\;\\;(M_r = 1)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\zeta \\ge \\frac{\\sqrt{3}}{2} \\approx 0.866',
            correct: false,
            misconception:
              'Solving $1 - 2\\zeta^2 = 0$ gives $\\zeta^2 = 1/2 \\implies \\zeta = 1/\\sqrt{2} \\approx 0.707$.',
          },
        ],
        lockedLabel: 'No-Peak Bound',
        lockedResultLatex: '\\textcolor{#34D399}{\\zeta \\ge \\frac{1}{\\sqrt{2}} \\approx 0.707} \\;\\;(\\text{Butterworth flat})',
        hint: 'Set the radicand $1 - 2\\zeta^2 = 0$ and solve for $\\zeta$.',
      },
    ],
  },

  {
    id: 'frq2-gm-pm-exact',
    tier: 'bode-freq',
    tierLabel: 'Bode & Resonance',
    title: 'Exact Gain Margin, Phase Margin & Delay Budget',
    mechatronicsContext:
      'Every networked motion controller faces both load-inertia gain drift and digital communication delay; computing exact Gain Margin and Phase Margin tells you precisely how much of each the servo can absorb before oscillating.',
    expressionLatex: 'L(s)=\\frac{5}{s(s+2)^2} \\;\\;(\\text{GM \\& PM})',
    finalAnswerLatex:
      '\\omega_{pc}=2\\;(\\text{GM}=3.2\\;/\\,+10.1\\text{ dB}), \\quad \\omega_{gc}=1\\;(\\text{PM}=36.9^\\circ,\\; \\tau_{\\max}\\approx 0.64\\text{ s})',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.2,
      wMax: 10,
      magMin: -32,
      magMax: 26,
      phMin: -230,
      phMax: -80,
      wGc: 1.0,
      pmDeg: 36.9,
      wPc: 2.0,
      gmDb: 10.1,
      magDbFn: (w) => 20 * Math.log10(5 / (w * (w * w + 4))),
      phaseDegFn: (w) => -90 - 2 * Math.atan(w / 2) * (180 / Math.PI),
      defaultCursor: 0.41,
      subtitle:
        'Hover or drag across $\\omega$: magnitude crosses $0\\text{ dB}$ cleanly at $\\omega_{gc} = 1$ ($\\text{PM} = 36.9^\\circ$), while phase crosses $-180^\\circ$ at $\\omega_{pc} = 2$ where $|L| = -10.1\\text{ dB}$ ($\\text{GM} = 3.2\\times$)!',
      domainMeta: 'Exact GM & PM · ωgc=1 (PM=36.9°) · ωpc=2 (GM=+10.1 dB)',
      metrics: [
        { label: 'Phase Cross ωpc', value: '2.0 rad/s (exact)' },
        { label: 'Gain Margin GM', value: '3.2× (+10.1 dB)' },
        { label: 'Gain Cross ωgc', value: '1.0 rad/s (exact)' },
        { label: 'PM & Delay τ_max', value: '36.9° · 0.64 s ✓' },
      ],
    },
    steps: [
      {
        stepType: 'phase_eq',
        badge: 'Open-Loop Phase Equation',
        whyThisStep:
          'Writing the exact analytical phase $\\angle L(j\\omega)$ lets you locate the $-180^\\circ$ stability boundary algebraically instead of eyeballing a graph.',
        systemImpact:
          'Because $L(s)$ has three poles ($1/s$ plus double pole at $-2$), phase sweeps smoothly from $-90^\\circ$ down to $-270^\\circ$ — guaranteeing a unique phase crossover $\\omega_{pc}$.',
        prompt:
          'Write the exact open-loop phase equation $\\angle L(j\\omega)$ for $L(s) = \\frac{5}{s(s+2)^2}$.',
        highlightLatex:
          'L(j\\omega) = \\frac{5}{(\\textcolor{#22D3EE}{j\\omega})(\\textcolor{#F59E0B}{2 + j\\omega})^2}',
        options: [
          {
            id: 'a',
            latex: '\\angle L(j\\omega) = -90^\\circ - \\arctan(\\omega/2)',
            correct: false,
            misconception:
              'The factor $(s+2)^2$ is a DOUBLE pole, so it contributes TWICE the phase lag: $-2\\arctan(\\omega/2)$.',
          },
          {
            id: 'b',
            latex: '\\angle L(j\\omega) = -90^\\circ - 2\\arctan(\\omega/2)',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\angle L(j\\omega) = -180^\\circ - 2\\arctan(\\omega/2)',
            correct: false,
            misconception:
              'A single integrator $1/(j\\omega)$ contributes $-90^\\circ$ (not $-180^\\circ$, which is for a double integrator $1/s^2$).',
          },
          {
            id: 'd',
            latex: '\\angle L(j\\omega) = -90^\\circ - 2\\arctan(2/\\omega)',
            correct: false,
            misconception:
              'For $(2 + j\\omega)$, $\\angle(2 + j\\omega) = \\arctan(\\text{imag}/\\text{real}) = \\arctan(\\omega/2)$, not $\\arctan(2/\\omega)$.',
          },
        ],
        lockedLabel: 'Phase Equation',
        lockedResultLatex: '\\angle L(j\\omega) = \\textcolor{#34D399}{-90^\\circ - 2\\arctan(\\omega/2)}',
        hint: 'Sum the phase of denominator factors: $-90^\\circ$ from $j\\omega$ and $-2\\angle(2+j\\omega)$.',
      },
      {
        stepType: 'phase_crossover',
        badge: 'Phase Crossover Frequency ωpc',
        whyThisStep:
          'At $\\omega_{pc}$, negative feedback flips completely into positive feedback ($\\angle L = -180^\\circ$), making $|L(j\\omega_{pc})|$ the exact measure of Gain Margin.',
        systemImpact:
          'At $\\omega_{pc} = 2\\text{ rad/s}$, each pole at $-2$ contributes $-45^\\circ$ ($-90^\\circ - 45^\\circ - 45^\\circ = -180^\\circ$): if gain rises until $|L(j2)| = 1$, the loop oscillates at $2\\text{ rad/s}$!',
        prompt:
          'Set $\\angle L(j\\omega_{pc}) = -180^\\circ$ to solve for the exact phase crossover frequency $\\omega_{pc}$.',
        highlightLatex:
          '-90^\\circ - 2\\arctan\\!\\left(\\frac{\\textcolor{#F59E0B}{\\omega_{pc}}}{2}\\right) = -180^\\circ',
        options: [
          {
            id: 'a',
            latex: '\\omega_{pc} = 2\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\omega_{pc} = 4\\text{ rad/s}',
            correct: false,
            misconception:
              'Solving $2\\arctan(\\omega_{pc}/2) = 90^\\circ$ gives $\\arctan(\\omega_{pc}/2) = 45^\\circ \\implies \\omega_{pc}/2 = 1 \\implies \\omega_{pc} = 2$.',
          },
          {
            id: 'c',
            latex: '\\omega_{pc} = 1\\text{ rad/s}',
            correct: false,
            misconception:
              'At $\\omega = 1$, $\\arctan(0.5) \\approx 26.6^\\circ$ giving $-143.1^\\circ$ (that is the GAIN crossover $\\omega_{gc}$, not phase crossover!).',
          },
          {
            id: 'd',
            latex: '\\omega_{pc} = \\sqrt{2}\\text{ rad/s}',
            correct: false,
            misconception:
              '$\\tan(45^\\circ) = 1$, so $\\omega_{pc}/2 = 1 \\implies \\omega_{pc} = 2\\text{ rad/s}$.',
          },
        ],
        lockedLabel: 'Phase Crossover',
        lockedResultLatex: '\\omega_{pc} = \\textcolor{#34D399}{2\\text{ rad/s}}',
        hint: 'Solve $\\arctan(\\omega_{pc}/2) = 45^\\circ$.',
      },
      {
        stepType: 'exact_gm',
        badge: 'Exact Gain Margin (GM)',
        whyThisStep:
          'Gain Margin measures the multiplicative safety factor by which plant or amplifier gain can drift upward before closed-loop oscillation begins.',
        systemImpact:
          'With $\\text{GM} = 3.2$ ($+10.1\\text{ dB}$), the loop comfortably exceeds the industrial $+6\\text{ dB}$ rule of thumb and tolerates over $3\\times$ gain drift!',
        prompt:
          'Evaluate $|L(j\\omega)| = \\frac{5}{\\omega(\\omega^2 + 4)}$ at $\\omega_{pc} = 2$ and compute $\\text{GM} = \\frac{1}{|L(j\\omega_{pc})|}$ (ratio and dB).',
        highlightLatex:
          '|L(j2)| = \\frac{5}{\\textcolor{#F59E0B}{2}\\,(\\textcolor{#F59E0B}{2}^2 + 4)} = \\frac{5}{16} \\implies \\text{GM} = \\frac{1}{|L(j2)|}',
        options: [
          {
            id: 'a',
            latex: '\\text{GM} = 0.3125 \\;\\;(-10.1\\text{ dB})',
            correct: false,
            misconception:
              'Gain Margin is the RECIPROCAL $1/|L(j\\omega_{pc})|$: since $|L| = 5/16 < 1$ is below $0\\text{ dB}$, the loop is STABLE with positive $\\text{GM} = 16/5 = 3.2$ ($+10.1\\text{ dB}$).',
          },
          {
            id: 'b',
            latex: '\\text{GM} = 1.6 \\;\\;(+4.1\\text{ dB})',
            correct: false,
            misconception:
              'Evaluate $|(2 + j2)^2| = (\\sqrt{8})^2 = 8$, so denominator is $2 \\cdot 8 = 16$ (not $8$), giving $\\text{GM} = 16/5 = 3.2$.',
          },
          {
            id: 'c',
            latex: '\\text{GM} = 3.2 \\;\\;(+10.1\\text{ dB})',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\text{GM} = 16.0 \\;\\;(+24.1\\text{ dB})',
            correct: false,
            misconception:
              'Remember the plant numerator $5$: $|L(j2)| = 5/16$, so $\\text{GM} = 16/5 = 3.2$.',
          },
        ],
        lockedLabel: 'Gain Margin',
        lockedResultLatex: '\\text{GM} = \\textcolor{#34D399}{\\frac{16}{5} = 3.2 \\;\\;(+10.1\\text{ dB})}',
        hint: 'Invert $|L(j2)| = 5/16$ and take $20\\log_{10}(3.2) \\approx 10.1\\text{ dB}$.',
      },
      {
        stepType: 'gain_crossover',
        badge: 'Exact Gain Crossover ωgc',
        whyThisStep:
          'Gain crossover $\\omega_{gc}$ sets the approximate closed-loop bandwidth and is the exact frequency where Phase Margin and time-delay tolerance are evaluated.',
        systemImpact:
          'Because $|L(j1)| = 1$ cleanly at $\\omega_{gc} = 1\\text{ rad/s} < \\omega_{pc} = 2\\text{ rad/s}$, the loop crosses $0\\text{ dB}$ BEFORE hitting $-180^\\circ$ — confirming closed-loop stability!',
        prompt:
          'Solve $|L(j\\omega_{gc})| = \\frac{5}{\\omega_{gc}(\\omega_{gc}^2 + 4)} = 1$ for the exact gain crossover frequency $\\omega_{gc}$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{\\omega_{gc}}(\\textcolor{#F59E0B}{\\omega_{gc}}^2 + 4) = 5',
        options: [
          {
            id: 'a',
            latex: '\\omega_{gc} = 1\\text{ rad/s}',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\omega_{gc} = 5\\text{ rad/s}',
            correct: false,
            misconception:
              'Plug $\\omega = 5$: $5(25 + 4) = 145 \\neq 5$; test $\\omega = 1$: $1(1 + 4) = 5$!',
          },
          {
            id: 'c',
            latex: '\\omega_{gc} = 1.25\\text{ rad/s}',
            correct: false,
            misconception:
              '$1.25$ comes from ignoring $\\omega^2$ ($4\\omega = 5$); with $\\omega^3 + 4\\omega = 5$, $\\omega_{gc} = 1$ is the exact real root!',
          },
          {
            id: 'd',
            latex: '\\omega_{gc} = 2\\text{ rad/s}',
            correct: false,
            misconception:
              'At $\\omega = 2$ (phase crossover), $|L(j2)| = 5/16 < 1$; since $|L|$ decreases monotonically, $\\omega_{gc}$ must be less than $2$.',
          },
        ],
        lockedLabel: 'Gain Crossover',
        lockedResultLatex: '\\omega_{gc} = \\textcolor{#34D399}{1\\text{ rad/s}} \\;\\;(|L(j1)| = 1)',
        hint: 'Test clean integer values in $\\omega(\\omega^2 + 4) = 5$.',
      },
      {
        stepType: 'exact_pm',
        badge: 'Exact Phase Margin (PM)',
        whyThisStep:
          'Phase Margin is the premier predictor of closed-loop damping ($\\zeta \\approx \\text{PM}/100^\\circ$): low PM immediately warns of oscillatory ringing even when Gain Margin looks large.',
        systemImpact:
          'At $\\text{PM} = 36.9^\\circ$ (exact 3-4-5 triangle $\\arctan(3/4)$!), effective closed-loop damping is only $\\zeta \\approx 0.37$ (~29% overshoot) — stable, yet underdamped enough to benefit from a lead boost!',
        prompt:
          'Compute the exact Phase Margin $\\text{PM} = 180^\\circ + \\angle L(j\\omega_{gc})$ at $\\omega_{gc} = 1\\text{ rad/s}$.',
        highlightLatex:
          '\\text{PM} = 180^\\circ + \\left(-90^\\circ - 2\\arctan\\!\\left(\\textcolor{#22D3EE}{\\tfrac{1}{2}}\\right)\\right) = 90^\\circ - 2\\arctan(0.5)',
        options: [
          {
            id: 'a',
            latex: '\\text{PM} \\approx 63.4^\\circ',
            correct: false,
            misconception:
              'Remember the factor of $2$ from the double pole $(s+2)^2$: $90^\\circ - 2(26.57^\\circ) = 36.87^\\circ$, not $90^\\circ - 26.57^\\circ$.',
          },
          {
            id: 'b',
            latex: '\\text{PM} = \\arctan\\!\\left(\\tfrac{3}{4}\\right) \\approx 36.9^\\circ',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{PM} \\approx 53.1^\\circ',
            correct: false,
            misconception:
              '$53.13^\\circ$ is $2\\arctan(0.5)$ (the double-pole lag); subtract it from $90^\\circ$ to get $\\text{PM} = 90^\\circ - 53.13^\\circ = 36.87^\\circ$.',
          },
          {
            id: 'd',
            latex: '\\text{PM} \\approx -36.9^\\circ \\;(\\text{unstable})',
            correct: false,
            misconception:
              '$\\angle L(j1) = -143.13^\\circ$ is ABOVE $-180^\\circ$, so $\\text{PM} = 180^\\circ - 143.13^\\circ = +36.87^\\circ > 0$ (stable!).',
          },
        ],
        lockedLabel: 'Phase Margin',
        lockedResultLatex: '\\text{PM} = \\textcolor{#34D399}{\\arctan(\\tfrac{3}{4}) \\approx 36.9^\\circ}',
        hint: 'Compute $\\arctan(0.5) \\approx 26.57^\\circ$, multiply by $2$, and subtract from $90^\\circ$.',
      },
      {
        stepType: 'delay_budget',
        badge: 'Max Pure Time Delay τ_max',
        whyThisStep:
          'A pure time delay $e^{-\\tau s}$ leaves magnitude $|L|$ completely untouched while shearing off phase linearly ($-\\omega\\tau$ rad) — converting Phase Margin directly into your maximum network/ADC latency budget!',
        systemImpact:
          'This servo can survive up to $\\tau_{\\max} \\approx 0.64\\text{ s}$ of unmodeled transport lag before going unstable (or $3.2\\times$ pure gain increase, though never both simultaneously!).',
        prompt:
          'Convert $\\text{PM} = 36.87^\\circ \\approx 0.6435\\text{ rad}$ at $\\omega_{gc} = 1\\text{ rad/s}$ into the exact delay margin $\\tau_{\\max} = \\frac{\\text{PM}_{\\text{rad}}}{\\omega_{gc}}$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{\\omega_{gc}}\\cdot\\tau_{\\max} = \\text{PM}_{\\text{rad}} = 36.87^\\circ \\cdot \\frac{\\pi}{180^\\circ}',
        options: [
          {
            id: 'a',
            latex: '\\tau_{\\max} \\approx 36.9\\text{ s}',
            correct: false,
            misconception:
              'ALWAYS convert degrees to RADIANS before dividing by $\\omega_{gc}$ (rad/s): $36.87^\\circ \\times \\frac{\\pi}{180^\\circ} \\approx 0.6435\\text{ rad}$.',
          },
          {
            id: 'b',
            latex: '\\tau_{\\max} \\approx 0.32\\text{ s}',
            correct: false,
            misconception:
              'Divide by $\\omega_{gc} = 1$ (gain crossover), NOT $\\omega_{pc} = 2$ (phase crossover): $0.6435 / 1 \\approx 0.64\\text{ s}$.',
          },
          {
            id: 'c',
            latex: '\\tau_{\\max} \\approx 0.64\\text{ s} \\;\\;(\\text{or }3.2\\times\\text{ gain drift})',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\tau_{\\max} = \\infty \\;\\;(\\text{delay does not affect stability})',
            correct: false,
            misconception:
              'Time delay adds $-\\omega\\tau$ unbounded phase lag and is one of the fastest ways to destabilize a real feedback loop!',
          },
        ],
        lockedLabel: 'Delay Margin',
        lockedResultLatex: '\\tau_{\\max} \\approx \\textcolor{#34D399}{0.64\\text{ s}} \\;\\;(\\text{PM}_{\\text{rad}}/\\omega_{gc})',
        hint: 'Convert $36.87^\\circ$ to radians ($\\approx 0.6435\\text{ rad}$) and divide by $\\omega_{gc} = 1\\text{ rad/s}$.',
      },
    ],
  },

  // =========================================================================
  // TIER 3: LEAD-LAG COMPENSATOR SYNTHESIS (2 problems)
  // =========================================================================
  {
    id: 'frq3-lead-design',
    tier: 'compensators',
    tierLabel: 'Lead-Lag Design',
    title: 'Phase-Lead Compensator Synthesis',
    mechatronicsContext:
      'When an optical tracker or gimbal needs faster bandwidth AND extra damping margin without ideal-derivative noise blow-up, a phase-lead compensator injects a targeted dome of positive phase right around crossover.',
    expressionLatex: 'G(s)=\\frac{4}{s(s+2)},\\;\\; \\phi_m=30^\\circ,\\; \\omega_m=3',
    finalAnswerLatex:
      '\\alpha=3,\\; z=\\sqrt{3},\\; p=3\\sqrt{3} \\implies C(s)=3\\frac{s+\\sqrt{3}}{s+3\\sqrt{3}} \\;\\;(\\text{PM}: 51.8^\\circ\\to 72.9^\\circ)',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.3,
      wMax: 30,
      magMin: -28,
      magMax: 26,
      phMin: -195,
      phMax: -85,
      wGc: 2.02,
      pmDeg: 72.9,
      magDbFn: (w) => {
        const s3 = Math.sqrt(3);
        const g = 4 / (w * Math.hypot(w, 2));
        const c = (3 * Math.hypot(w, s3)) / Math.hypot(w, 3 * s3);
        return 20 * Math.log10(g * c);
      },
      phaseDegFn: (w) => {
        const s3 = Math.sqrt(3);
        const r2d = 180 / Math.PI;
        return -90 - Math.atan(w / 2) * r2d + (Math.atan(w / s3) - Math.atan(w / (3 * s3))) * r2d;
      },
      defaultCursor: 0.42,
      subtitle:
        'Hover or drag across $\\omega$: the lead compensator $C(s)=3\\frac{s+\\sqrt{3}}{s+3\\sqrt{3}}$ pushes crossover from $1.57\\to 2.02\\text{ rad/s}$ AND lifts Phase Margin from $51.8^\\circ$ all the way to $72.9^\\circ$!',
      domainMeta: 'Lead-Compensated Bode · ωgc = 2.02 · PM = 72.9° (+21.1° boost)',
      metrics: [
        { label: 'Lead Ratio α', value: '3.0 (exact for 30°)' },
        { label: 'Zero & Pole', value: 'z=√3, p=3√3' },
        { label: 'Boosted PM', value: '51.8° → 72.9°' },
        { label: 'HF Noise Gain', value: '3× (+9.5 dB) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'lead_alpha',
        badge: 'Solve Lead Ratio α',
        whyThisStep:
          'The pole-to-zero spread ratio $\\alpha = p/z > 1$ is strictly locked to the maximum phase lead $\\phi_m$ — computing $\\alpha$ first immediately warns you of the high-frequency noise penalty.',
        systemImpact:
          'A clean integer spread $\\alpha = 3$ supplies $+30^\\circ$ of peak phase lead while keeping high-frequency amplification capped at a modest $3\\times$ ($+9.5\\text{ dB}$).',
        prompt:
          'For a lead compensator $C(s) = \\frac{1 + \\alpha Ts}{1 + Ts}$ ($\\alpha > 1$) supplying peak phase lead $\\phi_m = 30^\\circ$, solve $\\sin\\phi_m = \\frac{\\alpha - 1}{\\alpha + 1}$ for $\\alpha$.',
        highlightLatex:
          '\\alpha = \\frac{1 + \\sin\\textcolor{#F59E0B}{30^\\circ}}{1 - \\sin\\textcolor{#F59E0B}{30^\\circ}}',
        options: [
          {
            id: 'a',
            latex: '\\alpha = 3',
            correct: true,
          },
          {
            id: 'b',
            latex: '\\alpha = \\frac{1}{3}',
            correct: false,
            misconception:
              'In the form $\\frac{1 + \\alpha Ts}{1 + Ts}$, lead requires $\\alpha > 1$ (zero closer to origin than pole): $(1 + 0.5)/(1 - 0.5) = 3$.',
          },
          {
            id: 'c',
            latex: '\\alpha = 2',
            correct: false,
            misconception:
              'Evaluate $\\sin 30^\\circ = 0.5$: $\\frac{1 + 0.5}{1 - 0.5} = \\frac{1.5}{0.5} = 3$ (while $\\alpha = 2$ gives only $19.5^\\circ$).',
          },
          {
            id: 'd',
            latex: '\\alpha = 6',
            correct: false,
            misconception:
              'Check the arithmetic: $1.5 / 0.5 = 3$, not $6$ ($\\alpha = 6$ delivers $45.6^\\circ$ of lead).',
          },
        ],
        lockedLabel: 'Lead Ratio α',
        lockedResultLatex: '\\alpha = \\textcolor{#34D399}{3} \\;\\;(\\phi_m = 30^\\circ)',
        hint: 'Plug $\\sin 30^\\circ = 0.5$ into $\\frac{1 + \\sin\\phi_m}{1 - \\sin\\phi_m}$.',
      },
      {
        stepType: 'lead_mag_boost',
        badge: 'Gain Boost at Peak Freq ωm',
        whyThisStep:
          'A lead network NEVER boosts phase for free — it simultaneously boosts magnitude by $+10\\log_{10}(\\alpha)\\text{ dB}$ at $\\omega_m$, pushing the gain crossover $\\omega_{gc}$ to a higher frequency!',
        systemImpact:
          'Adding $+4.8\\text{ dB}$ ($\\sqrt{3}\\times$) at $\\omega_m$ shifts the crossover rightward (increasing bandwidth), which is why engineers pick $\\omega_m$ where the uncompensated plant sits at $-10\\log_{10}(\\alpha)\\text{ dB}$.',
        prompt:
          'Compute the magnitude boost $|C(j\\omega_m)| = \\sqrt{\\alpha}$ (and in dB) right at the frequency of peak phase lead $\\omega_m$ for $\\alpha = 3$.',
        highlightLatex:
          '|C(j\\omega_m)| = \\sqrt{\\textcolor{#34D399}{\\alpha}}, \\qquad 20\\log_{10}(\\sqrt{\\alpha}) = 10\\log_{10}(\\alpha)',
        options: [
          {
            id: 'a',
            latex: '|C(j\\omega_m)| = 3 \\;\\;(+9.5\\text{ dB})',
            correct: false,
            misconception:
              '$3$ ($+9.54\\text{ dB}$) is the HIGH-FREQUENCY asymptote as $\\omega \\to \\infty$; at the geometric midpoint $\\omega_m$, you are halfway up the shelf: $\\sqrt{3}$ ($+4.77\\text{ dB}$)!',
          },
          {
            id: 'b',
            latex: '|C(j\\omega_m)| = \\sqrt{3} \\;\\;(+4.8\\text{ dB})',
            correct: true,
          },
          {
            id: 'c',
            latex: '|C(j\\omega_m)| = 1 \\;\\;(0\\text{ dB})',
            correct: false,
            misconception:
              '$0\\text{ dB}$ is the DC gain at $\\omega = 0$; by $\\omega_m$, the zero has already lifted the magnitude by $+10\\log_{10}(\\alpha)$.',
          },
          {
            id: 'd',
            latex: '|C(j\\omega_m)| = \\frac{1}{\\sqrt{3}} \\;\\;(-4.8\\text{ dB})',
            correct: false,
            misconception:
              'Lead networks AMPLIFY mid/high frequencies ($+4.8\\text{ dB}$); $-4.8\\text{ dB}$ is the target uncompensated plant magnitude where you place $\\omega_m$.',
          },
        ],
        lockedLabel: 'Midpoint Boost',
        lockedResultLatex: '|C(j\\omega_m)| = \\textcolor{#34D399}{\\sqrt{3} \\;\\;(+4.8\\text{ dB})}',
        hint: 'Evaluate $\\sqrt{3} \\approx 1.732$ and $10\\log_{10}(3) \\approx 4.77\\text{ dB}$.',
      },
      {
        stepType: 'lead_time_const',
        badge: 'Time Constant T at ωm = 3',
        whyThisStep:
          'Centering the phase-lead dome cleanly at $\\omega_m = \\frac{1}{T\\sqrt{\\alpha}}$ ensures you harvest the maximum $+30^\\circ$ phase margin right near the new crossover.',
        systemImpact:
          'Fixing $T = \\frac{1}{3\\sqrt{3}} \\approx 0.192\\text{ s}$ pins both the zero and pole symmetrically around $\\omega_m = 3\\text{ rad/s}$ on a logarithmic Bode scale.',
        prompt:
          'With $\\alpha = 3$ and target peak frequency $\\omega_m = 3\\text{ rad/s}$, solve $\\omega_m = \\frac{1}{T\\sqrt{\\alpha}}$ for the time constant $T$.',
        highlightLatex:
          '\\textcolor{#F59E0B}{3} = \\frac{1}{\\textcolor{#22D3EE}{T}\\sqrt{\\textcolor{#34D399}{3}}}',
        options: [
          {
            id: 'a',
            latex: 'T = \\frac{1}{3\\sqrt{3}} \\approx 0.192\\text{ s}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'T = \\frac{1}{9} \\approx 0.111\\text{ s}',
            correct: false,
            misconception:
              'Take the square root of $\\alpha = 3$: $T = \\frac{1}{\\omega_m\\sqrt{\\alpha}} = \\frac{1}{3\\sqrt{3}}$, not $\\frac{1}{3\\cdot 3}$.',
          },
          {
            id: 'c',
            latex: 'T = \\frac{\\sqrt{3}}{3} \\approx 0.577\\text{ s}',
            correct: false,
            misconception:
              'That is $\\alpha T = 1/\\sqrt{3}$ (the inverse zero $1/z$); $T$ itself is smaller by $\\alpha = 3$.',
          },
          {
            id: 'd',
            latex: 'T = 3\\sqrt{3} \\approx 5.20\\text{ s}',
            correct: false,
            misconception:
              '$3\\sqrt{3}$ is $1/T$ (the pole frequency $p$ in rad/s), not the time constant $T$ in seconds!',
          },
        ],
        lockedLabel: 'Time Constant T',
        lockedResultLatex: 'T = \\textcolor{#34D399}{\\frac{1}{3\\sqrt{3}} \\approx 0.192\\text{ s}}',
        hint: 'Rearrange $\\omega_m = 1/(T\\sqrt{\\alpha})$ directly for $T$.',
      },
      {
        stepType: 'lead_pole_zero',
        badge: 'Exact Zero z & Pole p',
        whyThisStep:
          'Checking the pole-zero pair $(z, p)$ confirms two sanity checks simultaneously: $z < p$ (true lead!) and $\\sqrt{zp} = \\omega_m$ (exact logarithmic symmetry!).',
        systemImpact:
          'Zero at $z = \\sqrt{3} \\approx 1.73$ starts lifting phase well before crossover while pole at $p = 3\\sqrt{3} \\approx 5.20$ caps the derivative action cleanly at $3\\times$!',
        prompt:
          'Compute the exact zero $z = \\frac{1}{\\alpha T}$ and pole $p = \\frac{1}{T}$ for $\\alpha = 3,\\; T = \\frac{1}{3\\sqrt{3}}$.',
        highlightLatex:
          'z = \\frac{1}{\\textcolor{#34D399}{3}\\,T} = \\frac{\\omega_m}{\\sqrt{\\alpha}}, \\qquad p = \\frac{1}{T} = \\omega_m\\sqrt{\\alpha}',
        options: [
          {
            id: 'a',
            latex: 'z = 3\\sqrt{3} \\approx 5.20, \\qquad p = \\sqrt{3} \\approx 1.73',
            correct: false,
            misconception:
              'That reverses pole and zero ($p < z$), creating a PHASE-LAG network instead of phase-lead! Lead ALWAYS has $z < p$.',
          },
          {
            id: 'b',
            latex: 'z = 1, \\qquad p = 9',
            correct: false,
            misconception:
              'A ratio of $p/z = 9$ corresponds to $\\alpha = 9$ ($\\phi_m = 53.1^\\circ$), not $\\alpha = 3$ ($p/z = 3$).',
          },
          {
            id: 'c',
            latex: 'z = \\sqrt{3} \\approx 1.73, \\qquad p = 3\\sqrt{3} \\approx 5.20',
            correct: true,
          },
          {
            id: 'd',
            latex: 'z = 1.5, \\qquad p = 4.5',
            correct: false,
            misconception:
              'Check the geometric mean: $\\sqrt{1.5 \\times 4.5} = \\sqrt{6.75} \\approx 2.60 \\neq 3$; use $\\omega_m/\\sqrt{3} = \\sqrt{3}$ and $\\omega_m\\sqrt{3} = 3\\sqrt{3}$.',
          },
        ],
        lockedLabel: 'Zero & Pole',
        lockedResultLatex: 'z = \\textcolor{#34D399}{\\sqrt{3} \\approx 1.73}, \\quad p = \\textcolor{#34D399}{3\\sqrt{3} \\approx 5.20}',
        hint: 'Use $z = \\omega_m/\\sqrt{\\alpha} = 3/\\sqrt{3} = \\sqrt{3}$ and $p = \\omega_m\\sqrt{\\alpha} = 3\\sqrt{3}$.',
      },
      {
        stepType: 'lead_tf_form',
        badge: 'Unit-DC-Gain Compensator C(s)',
        whyThisStep:
          'Preserving unity DC gain ($C(0) = 1$) guarantees your lead compensator will NOT degrade the plant\'s existing steady-state tracking accuracy $K_v$.',
        systemImpact:
          'With $C(s) = 3\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}$, $C(0) = 1$ (keeping $K_v = 2$ intact) while lifting the compensated loop\'s Phase Margin from $51.8^\\circ$ to $72.9^\\circ$!',
        prompt:
          'Rewrite $C(s) = \\frac{1 + s/\\sqrt{3}}{1 + s/(3\\sqrt{3})}$ in factored pole-zero form while preserving $C(0) = 1$.',
        highlightLatex:
          'C(s) = \\frac{1 + s/\\textcolor{#34D399}{\\sqrt{3}}}{1 + s/(\\textcolor{#34D399}{3\\sqrt{3}})} = \\textcolor{#F59E0B}{K_c}\\,\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}',
        options: [
          {
            id: 'a',
            latex: 'C(s) = \\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}',
            correct: false,
            misconception:
              'Check DC gain: without the factor of $3$, $C(0) = \\frac{\\sqrt{3}}{3\\sqrt{3}} = \\frac{1}{3}$, which cuts your steady-state accuracy $K_v$ by $3\\times$!',
          },
          {
            id: 'b',
            latex: 'C(s) = 3\\,\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}',
            correct: true,
          },
          {
            id: 'c',
            latex: 'C(s) = \\frac{1}{3}\\,\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}',
            correct: false,
            misconception:
              'Multiplying by $1/3$ reduces DC gain to $1/9$; multiply by $p/z = \\alpha = 3$ so $C(0) = 3(\\sqrt{3}/3\\sqrt{3}) = 1$.',
          },
          {
            id: 'd',
            latex: 'C(s) = 3\\,\\frac{s + 3\\sqrt{3}}{s + \\sqrt{3}}',
            correct: false,
            misconception:
              'Zero goes in the numerator ($s + \\sqrt{3}$) and pole goes in the denominator ($s + 3\\sqrt{3}$).',
          },
        ],
        lockedLabel: 'Compensator C(s)',
        lockedResultLatex: 'C(s) = \\textcolor{#34D399}{3\\,\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}} \\;\\;(C(0)=1)',
        hint: 'Multiply numerator and denominator by $3\\sqrt{3}$ and factor out $3$ from the numerator.',
      },
      {
        stepType: 'lead_tradeoff',
        badge: 'High-Freq Noise Trade-Off',
        whyThisStep:
          'Every real lead compensator trades stability margin and speed against high-frequency sensor noise — evaluating $|C(j\\infty)|$ tells you if your ADC or encoder can handle it.',
        systemImpact:
          'Because $|C(j\\infty)| = \\alpha = 3$ ($+9.5\\text{ dB}$), you gain $+21^\\circ$ of Phase Margin and $28\\%$ wider bandwidth at the cost of $3\\times$ higher high-frequency actuator chatter from sensor noise.',
        prompt:
          'Evaluate $\\lim_{\\omega \\to \\infty} |C(j\\omega)|$ for $C(s) = 3\\frac{s + \\sqrt{3}}{s + 3\\sqrt{3}}$ and state the fundamental engineering trade-off of lead compensation.',
        highlightLatex:
          '|C(0)| = 1 \\quad\\longrightarrow\\quad |C(j\\infty)| = \\textcolor{#F59E0B}{\\alpha = 3}',
        options: [
          {
            id: 'a',
            latex: '|C(j\\infty)| = \\frac{1}{3} \\;\\;(\\text{attenuates HF noise } 3\\times)',
            correct: false,
            misconception:
              'Attenuating HF noise is what a LAG compensator does; a unity-DC LEAD compensator AMPLIFIES high frequencies by $\\alpha = 3$!',
          },
          {
            id: 'b',
            latex: '|C(j\\infty)| = 1 \\;\\;(\\text{zero noise penalty})',
            correct: false,
            misconception:
              'As $s \\to \\infty$, $\\frac{s+\\sqrt{3}}{s+3\\sqrt{3}} \\to 1$, leaving the prefactor $3$ — so HF gain is $3$ ($+9.5\\text{ dB}$).',
          },
          {
            id: 'c',
            latex: '|C(j\\infty)| = \\infty \\;\\;(\\text{unbounded like ideal PD})',
            correct: false,
            misconception:
              'The whole reason we include the pole at $p = 3\\sqrt{3}$ is to CAP high-frequency gain at a finite $\\alpha = 3$ instead of $\\infty$!',
          },
          {
            id: 'd',
            latex: '|C(j\\infty)| = 3 \\;\\;(\\text{wider BW \\& PM, } 3\\times\\text{ HF noise})',
            correct: true,
          },
        ],
        lockedLabel: 'Lead Trade-Off',
        lockedResultLatex: '\\textcolor{#34D399}{|C(j\\infty)| = 3} \\;\\;(\\text{wider BW \\& PM, } 3\\times\\text{ HF sensor noise})',
        hint: 'Take the ratio of leading $s$-terms in $3\\frac{s+\\sqrt{3}}{s+3\\sqrt{3}}$.',
      },
    ],
  },

  {
    id: 'frq3-lag-design',
    tier: 'compensators',
    tierLabel: 'Lead-Lag Design',
    title: 'Phase-Lag Compensator for 10× Tracking Accuracy',
    mechatronicsContext:
      'CNC contouring axes and radar trackers require razor-sharp steady-state ramp accuracy ($K_v = 10$) without pushing crossover into structural modes; a phase-lag dipole boosts low-frequency gain $10\\times$ while leaving crossover almost untouched.',
    expressionLatex: 'G(s)=\\frac{1}{s(s+1)},\\;\\; K_v=10 \\;\\;(\\text{Lag})',
    finalAnswerLatex:
      'C_{\\text{tot}}(s)=\\frac{s+0.08}{s+0.008} \\implies K_v=10,\\;\\; \\Delta\\phi\\approx -5.1^\\circ,\\;\\; \\text{PM}\\approx 46.5^\\circ',
    verifyPlot: {
      kind: 'bode-margin',
      wMin: 0.005,
      wMax: 5,
      magMin: -28,
      magMax: 42,
      phMin: -200,
      phMax: -85,
      wGc: 0.789,
      pmDeg: 46.5,
      magDbFn: (w) => {
        const g = 1 / (w * Math.hypot(w, 1));
        const c = Math.hypot(w, 0.08) / Math.hypot(w, 0.008);
        return 20 * Math.log10(g * c);
      },
      phaseDegFn: (w) => {
        const r2d = 180 / Math.PI;
        return -90 - Math.atan(w) * r2d + (Math.atan(w / 0.08) - Math.atan(w / 0.008)) * r2d;
      },
      defaultCursor: 0.73,
      subtitle:
        'Hover or drag across $\\omega$: at low frequency ($\\omega < 0.008$), $|L|$ gets a full $+20\\text{ dB}$ ($10\\times$) boost, yet by crossover $\\omega_{gc} = 0.79$, the lag network has flattened back to $0\\text{ dB}$ and costs only $5.1^\\circ$ of Phase Margin!',
      domainMeta: 'Lag-Compensated Bode · +20 dB DC Boost · PM = 46.5°',
      metrics: [
        { label: 'DC Boost β', value: '10× (+20 dB, Kv=10)' },
        { label: 'Lag Dipole', value: 'z = 0.08, p = 0.008' },
        { label: 'Phase Penalty', value: '−5.1° at ωgc = 0.8' },
        { label: 'Final PM', value: '46.5° (vs 51.8° uncomp) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'dc_boost_kv',
        badge: 'Required DC Gain for Kv = 10',
        whyThisStep:
          'Checking uncompensated $K_{v0}$ shows how much extra low-frequency gain is needed — and why simply cranking proportional gain $K = 10$ would wreck Phase Margin.',
        systemImpact:
          'Cranking pure proportional gain to $K = 10$ would smash $\\text{PM}$ down from $51.8^\\circ$ to just $18^\\circ$ (violent ringing!); a lag network gives the SAME $10\\times$ DC accuracy while protecting crossover!',
        prompt:
          'For $G(s) = \\frac{1}{s(s+1)}$, find the uncompensated velocity constant $K_{v0} = \\lim_{s\\to 0} sG(s)$ and the DC gain factor $\\beta$ required to hit $K_v = 10$.',
        highlightLatex:
          'K_{v0} = \\lim_{s\\to 0} s\\cdot\\frac{1}{s(s+1)}, \\qquad K_v^{\\text{target}} = \\textcolor{#F59E0B}{10}',
        options: [
          {
            id: 'a',
            latex: 'K_{v0} = 1 \\implies \\text{need } 10\\times\\text{ DC gain } (\\beta = 10)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'K_{v0} = 0 \\implies \\text{must add a second integrator } 1/s',
            correct: false,
            misconception:
              '$G(s)$ already has an integrator $1/s$, so $K_{v0} = \\frac{1}{0+1} = 1$ (finite non-zero velocity constant, Type-1!).',
          },
          {
            id: 'c',
            latex: 'K_{v0} = 10 \\implies \\text{already satisfies } K_v = 10',
            correct: false,
            misconception:
              'Setting $s=0$ in $\\frac{1}{s+1}$ gives $K_{v0} = 1$, which leaves a huge $100\\%$ ramp lag ($e_{ss} = 1/1 = 1.0$) instead of $0.1$.',
          },
          {
            id: 'd',
            latex: 'K_{v0} = 1 \\implies \\text{need } \\beta = 0.1\\text{ DC gain}',
            correct: false,
            misconception:
              'To shrink steady-state ramp error $e_{ss} = 1/K_v$ by $10\\times$, you must INCREASE DC gain by $10\\times$ ($\\beta = 10$).',
          },
        ],
        lockedLabel: 'DC Gain Target',
        lockedResultLatex: 'K_{v0} = 1 \\implies \\textcolor{#34D399}{\\beta = 10 \\;\\;(+20\\text{ dB at DC})}',
        hint: 'Evaluate $\\lim_{s\\to 0} \\frac{1}{s+1}$ and divide the target $K_v = 10$ by $K_{v0}$.',
      },
      {
        stepType: 'lag_structure',
        badge: 'Lag Compensator Structure',
        whyThisStep:
          'Writing $C_{\\text{tot}}(s) = 10\\frac{1 + Ts}{1 + 10Ts}$ in pole-zero form exposes the clever decoupling of lag compensation: boosting low-frequency accuracy while protecting crossover gain!',
        systemImpact:
          'Because $C_{\\text{tot}}(0) = 10$ and $C_{\\text{tot}}(\\infty) = 1$, the high-frequency $-20\\text{ dB}$ attenuation of the lag stage EXACTLY cancels the $K=10$ boost near $\\omega_{gc}$!',
        prompt:
          'Simplify $C_{\\text{tot}}(s) = K\\,\\frac{1 + Ts}{1 + \\beta Ts}$ with $K = 10,\\; \\beta = 10$ into pole-zero form using $z = 1/T$.',
        highlightLatex:
          'C_{\\text{tot}}(s) = \\textcolor{#F59E0B}{10}\\,\\frac{1 + s/z}{1 + \\textcolor{#F59E0B}{10}\\,s/z}',
        options: [
          {
            id: 'a',
            latex: 'C_{\\text{tot}}(s) = \\frac{s + z}{s + z/10} \\;\\;(C(0)=10,\\; C(\\infty)=1)',
            correct: true,
          },
          {
            id: 'b',
            latex: 'C_{\\text{tot}}(s) = 10\\,\\frac{s + z}{s + z/10} \\;\\;(C(0)=100,\\; C(\\infty)=10)',
            correct: false,
            misconception:
              'Factoring $1/z$ from top and $10/z$ from bottom cancels the leading $10$: $10 \\cdot \\frac{1/z}{10/z} = 1$!',
          },
          {
            id: 'c',
            latex: 'C_{\\text{tot}}(s) = \\frac{s + z/10}{s + z} \\;\\;(C(0)=0.1,\\; C(\\infty)=1)',
            correct: false,
            misconception:
              'In a LAG compensator, the POLE is closer to the origin than the zero ($p = z/10 < z$) so DC gain is $> 1$.',
          },
          {
            id: 'd',
            latex: 'C_{\\text{tot}}(s) = \\frac{s + 10z}{s + z} \\;\\;(C(0)=10,\\; C(\\infty)=1)',
            correct: false,
            misconception:
              'Check the zero of $1 + Ts = 0$: $s = -1/T = -z$, while $1 + 10Ts = 0$ puts the pole at $s = -1/(10T) = -z/10$.',
          },
        ],
        lockedLabel: 'Lag Structure',
        lockedResultLatex: 'C_{\\text{tot}}(s) = \\textcolor{#34D399}{\\frac{s + z}{s + z/10}} \\;\\;(C(0)=10,\\; C(\\infty)=1)',
        hint: 'Multiply numerator and denominator of $10\\frac{1 + s/z}{1 + 10s/z}$ by $z/10$.',
      },
      {
        stepType: 'lag_corner_rule',
        badge: 'Decade Rule Below Crossover',
        whyThisStep:
          'A lag compensator adds unwanted negative phase between $p$ and $z$ — placing the zero $z$ one full decade below $\\omega_{gc}$ hides that phase dip far away from crossover!',
        systemImpact:
          'Putting $z = 0.08$ and $p = 0.008$ leaves the uncompensated crossover $\\omega_{gc} \\approx 0.79\\text{ rad/s}$ practically undisturbed while delivering the full $10\\times$ DC gain.',
        prompt:
          'Uncompensated $G(s)$ crosses $0\\text{ dB}$ near $\\omega_{gc} \\approx 0.79\\text{ rad/s}$ ($\\text{PM} = 51.8^\\circ$). Placing $z \\approx 0.1\\,\\omega_{gc} = 0.08$, find the exact pole $p = z/\\beta$.',
        highlightLatex:
          'z = \\textcolor{#34D399}{0.08} \\approx 0.1\\,\\omega_{gc}, \\qquad p = \\frac{z}{\\textcolor{#F59E0B}{10}}',
        options: [
          {
            id: 'a',
            latex: 'z = 0.08, \\qquad p = 0.80',
            correct: false,
            misconception:
              'Putting $p = 0.80 > z$ creates a LEAD compensator (decreasing DC gain by $10\\times$); for lag, DIVIDE by $\\beta = 10$!',
          },
          {
            id: 'b',
            latex: 'z = 0.08, \\qquad p = 0.008',
            correct: true,
          },
          {
            id: 'c',
            latex: 'z = 8.0, \\qquad p = 0.80',
            correct: false,
            misconception:
              'Placing the lag dipole ABOVE crossover puts its massive $-55^\\circ$ phase dip right on top of $\\omega_{gc}$, wrecking stability!',
          },
          {
            id: 'd',
            latex: 'z = 0.08, \\qquad p = 0.04',
            correct: false,
            misconception:
              'With $z/p = 2$, DC gain only doubles ($K_v = 2$) instead of hitting $K_v = 10$ ($z/p = 10$).',
          },
        ],
        lockedLabel: 'Lag Dipole',
        lockedResultLatex: 'z = \\textcolor{#34D399}{0.08}, \\qquad p = \\textcolor{#34D399}{0.008}',
        hint: 'Divide $z = 0.08$ by $\\beta = 10$ to keep $z/p = 10$.',
      },
      {
        stepType: 'phase_penalty',
        badge: 'Residual Phase Lag at ωgc',
        whyThisStep:
          'Verifying the exact residual phase loss at $\\omega_{gc}$ confirms your decade-rule placement preserved a healthy Phase Margin ($> 45^\\circ$).',
        systemImpact:
          'The lag dipole shaves only $5.1^\\circ$ off Phase Margin ($51.8^\\circ \\to 46.5^\\circ$), proving how cleanly you can decouple low-frequency accuracy from crossover stability!',
        prompt:
          'Evaluate the phase lag $\\Delta\\phi = \\arctan(\\omega_{gc}/z) - \\arctan(\\omega_{gc}/p)$ at $\\omega_{gc} = 0.8\\text{ rad/s}$ for $z = 0.08,\\; p = 0.008$.',
        highlightLatex:
          '\\Delta\\phi = \\arctan(\\textcolor{#34D399}{10}) - \\arctan(\\textcolor{#F59E0B}{100})',
        options: [
          {
            id: 'a',
            latex: '\\Delta\\phi \\approx +5.1^\\circ \\;\\;(\\text{adds phase lead})',
            correct: false,
            misconception:
              '$\\arctan(10) < \\arctan(100)$, so the difference is NEGATIVE ($-5.1^\\circ$ phase lag, never lead!).',
          },
          {
            id: 'b',
            latex: '\\Delta\\phi \\approx -54.9^\\circ \\;\\;(\\text{destabilizes loop})',
            correct: false,
            misconception:
              '$-54.9^\\circ$ is the peak lag at the dipole midpoint $\\omega = \\sqrt{0.08\\cdot 0.008} \\approx 0.025$; way up at $\\omega_{gc} = 0.8$, both angles are near $90^\\circ$ and almost cancel!',
          },
          {
            id: 'c',
            latex: '\\Delta\\phi \\approx -5.1^\\circ \\;\\;(\\text{PM stays } > 46^\\circ)',
            correct: true,
          },
          {
            id: 'd',
            latex: '\\Delta\\phi = 0^\\circ \\;\\;(\\text{zero phase cost})',
            correct: false,
            misconception:
              'The decade rule shrinks phase loss below $6^\\circ$ (specifically $\\arctan 10 - \\arctan 100 \\approx -5.14^\\circ$), not literally $0^\\circ$.',
          },
        ],
        lockedLabel: 'Phase Penalty',
        lockedResultLatex: '\\Delta\\phi \\approx \\textcolor{#34D399}{-5.1^\\circ} \\;\\;(\\text{PM} \\approx 46.5^\\circ)',
        hint: 'Use $\\arctan(10) \\approx 84.3^\\circ$ and $\\arctan(100) \\approx 89.4^\\circ$.',
      },
      {
        stepType: 'lag_tradeoff',
        badge: 'Pole-Zero Dipole Settling Tail',
        whyThisStep:
          'Just as lead has a noise penalty, lag has a subtle time-domain penalty — recognizing the slow dipole tail prevents confusion when your step response takes surprisingly long to finish its last 2%!',
        systemImpact:
          'A closed-loop pole gets trapped right next to the slow zero $s \\approx -0.08$, creating a small-amplitude, long-lived exponential tail ($\\tau \\approx 12.5\\text{ s}$) — the classic trade-off for $10\\times$ DC accuracy.',
        prompt:
          'What is the hidden time-domain side effect of placing the lag dipole $(p = 0.008,\\; z = 0.08)$ close to the origin?',
        highlightLatex:
          'p_{\\text{CL,slow}} \\approx -z = \\textcolor{#F59E0B}{-0.08} \\implies \\text{small residue } \\epsilon\\,e^{-0.08t}',
        options: [
          {
            id: 'a',
            latex: '\\text{Amplifies high-frequency encoder noise by } 10\\times',
            correct: false,
            misconception:
              'At high frequency $C_{\\text{tot}}(\\infty) = 1$ ($0\\text{ dB}$), so lag adds ZERO high-frequency noise amplification (unlike lead!).',
          },
          {
            id: 'b',
            latex: '\\text{Slow pole-zero dipole near } s \\approx -z \\text{ creates a long settling tail}',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{Cuts closed-loop bandwidth by } 10\\times',
            correct: false,
            misconception:
              'Crossover $\\omega_{gc}$ stayed virtually unchanged ($0.786 \\to 0.789\\text{ rad/s}$), so initial rise time and bandwidth barely budge!',
          },
          {
            id: 'd',
            latex: '\\text{Destroys zero steady-state step error}',
            correct: false,
            misconception:
              'The plant integrator $1/s$ remains intact, so step error stays $0$ while ramp error shrinks $10\\times$!',
          },
        ],
        lockedLabel: 'Lag Trade-Off',
        lockedResultLatex: '\\textcolor{#34D399}{\\text{Slow dipole tail near } s\\approx -0.08\\text{ lengthens final }T_s}',
        hint: 'Remember what happens to a closed-loop pole trapped near a slow open-loop zero $z = 0.08$.',
      },
    ],
  },

  // =========================================================================
  // TIER 4: SENSITIVITY ROBUSTNESS & NYQUIST CRITERION (2 problems)
  // =========================================================================
  {
    id: 'frq4-sensitivity-tradeoff',
    tier: 'robustness',
    tierLabel: 'Margins & Sensitivity',
    title: 'Sensitivity S(s), T(s) & Waterbed Robustness',
    mechatronicsContext:
      'Every high-precision feedback loop simultaneously fights low-frequency load disturbances and high-frequency sensor noise; the algebraic identity linking $S(s)$ and $T(s)$ dictates the fundamental law of loop shaping.',
    expressionLatex: 'S(s)=\\frac{1}{1+L},\\;\\; T(s)=\\frac{L}{1+L}',
    finalAnswerLatex:
      'S+T=1, \\quad d_{\\min}=\\frac{1}{M_s}, \\quad M_s\\le 1.6 \\implies \\text{GM}\\ge 2.67,\\; \\text{PM}\\ge 36.4^\\circ',
    verifyPlot: {
      kind: 'bode-margin',
      sensitivityMode: true,
      wMin: 0.1,
      wMax: 30,
      magMin: -28,
      magMax: 12,
      wGc: 1.57,
      msPeak: { w: 2.34, db: 3.33, val: 1.47 },
      // Example loop L(s) = 4 / (s(s+2)) -> S = s(s+2)/(s^2+2s+4), T = 4/(s^2+2s+4)
      sDbFn: (w) => 20 * Math.log10((w * Math.hypot(w, 2)) / Math.hypot(4 - w * w, 2 * w)),
      tDbFn: (w) => 20 * Math.log10(4 / Math.hypot(4 - w * w, 2 * w)),
      magDbFn: (w) => 20 * Math.log10(4 / (w * Math.hypot(w, 2))),
      defaultCursor: 0.56,
      subtitle:
        'Hover or drag across $\\omega$ (example $L(s)=\\frac{4}{s(s+2)}$): top panel proves $|S|\\ll 1$ (Cyan) at low $\\omega$ and $|T|\\ll 1$ (Emerald) at high $\\omega$ — with the waterbed bump $M_s = 1.47$ ($+3.3\\text{ dB}$) peaking right past crossover!',
      domainMeta: 'Loop Shaping · |S(jω)| vs |T(jω)| & |L(jω)| · Ms = 1.47 < 1.6',
      metrics: [
        { label: 'Core Identity', value: 'S(s) + T(s) = 1 ∀ω' },
        { label: 'Disturb vs Noise', value: '|L|≫1 low · |L|≪1 high' },
        { label: 'Nyquist Distance', value: 'd_min = 1 / Ms' },
        { label: 'Ms = 1.6 Bounds', value: 'GM≥2.67 · PM≥36.4° ✓' },
      ],
    },
    steps: [
      {
        stepType: 'st_identity',
        badge: 'Fundamental S + T Identity',
        whyThisStep:
          'Adding $S(s)$ and $T(s)$ reveals the iron conservation law of feedback: you can NEVER make both disturbance sensitivity and sensor-noise gain small at the same frequency!',
        systemImpact:
          'Because $S(j\\omega) + T(j\\omega) = 1$ at every frequency, engineers MUST separate disturbance rejection (low $\\omega$) from noise attenuation (high $\\omega$) across crossover.',
        prompt:
          'Add the sensitivity function $S(s) = \\frac{1}{1 + L(s)}$ and complementary sensitivity $T(s) = \\frac{L(s)}{1 + L(s)}$.',
        highlightLatex:
          '\\textcolor{#22D3EE}{S(s)} + \\textcolor{#34D399}{T(s)} = \\frac{1}{1 + L(s)} + \\frac{L(s)}{1 + L(s)}',
        options: [
          {
            id: 'a',
            latex: 'S(s) + T(s) = 1 \\quad \\forall\\,s',
            correct: true,
          },
          {
            id: 'b',
            latex: 'S(s) + T(s) = L(s) \\quad \\forall\\,s',
            correct: false,
            misconception:
              'Combining over the common denominator $(1 + L)$ yields $\\frac{1 + L(s)}{1 + L(s)} = 1$, independent of $L(s)$!',
          },
          {
            id: 'c',
            latex: '|S(j\\omega)| + |T(j\\omega)| = 1 \\quad \\forall\\,\\omega',
            correct: false,
            misconception:
              'Watch out! Complex addition gives $S + T = 1$, so by the triangle inequality $|S| + |T| \\ge 1$ — near resonance BOTH $|S|$ and $|T|$ can exceed $1$ simultaneously!',
          },
          {
            id: 'd',
            latex: 'S(s) \\cdot T(s) = 1 \\quad \\forall\\,s',
            correct: false,
            misconception:
              'They SUM to $1$ ($S + T = 1$), not multiply to $1$ — that is why $T(s)$ is called the COMPLEMENTARY sensitivity.',
          },
        ],
        lockedLabel: 'S + T = 1 Law',
        lockedResultLatex: '\\textcolor{#34D399}{S(s) + T(s) = 1 \\quad \\forall\\,s}',
        hint: 'Add the two fractions over their shared denominator $1 + L(s)$.',
      },
      {
        stepType: 'disturbance_rej',
        badge: 'Low-Freq Disturbance Rejection',
        whyThisStep:
          'Output disturbances (wind gusts, cutting forces, gravity torque) pass straight through $S(s)$ to the output — sizing $|L(j\\omega)|$ at low frequency determines how stiff your machine feels.',
        systemImpact:
          'Making $|L(j\\omega)| = 100$ ($+40\\text{ dB}$) over the disturbance band crushes $|S| \\approx 0.01$ ($-40\\text{ dB}$), rejecting $99\\%$ of external load disturbances!',
        prompt:
          'Since output disturbance $D(s)$ enters output via $Y(s) = S(s)D(s)$, what condition on loop magnitude $|L(j\\omega)|$ achieves strong disturbance rejection ($|S(j\\omega)| \\ll 1$)?',
        highlightLatex:
          '|S(j\\omega)| = \\frac{1}{|1 + \\textcolor{#22D3EE}{L(j\\omega)}|} \\ll 1',
        options: [
          {
            id: 'a',
            latex: '|L(j\\omega)| \\ll 1 \\implies |S(j\\omega)| \\ll 1',
            correct: false,
            misconception:
              'If $|L| \\ll 1$, then $S = \\frac{1}{1+L} \\approx 1$ — meaning disturbances pass $100\\%$ unattenuated into the output!',
          },
          {
            id: 'b',
            latex: '|L(j\\omega)| \\gg 1 \\implies |S(j\\omega)| \\ll 1',
            correct: true,
          },
          {
            id: 'c',
            latex: '|L(j\\omega)| \\approx 1 \\implies |S(j\\omega)| \\ll 1',
            correct: false,
            misconception:
              'When $|L| \\approx 1$ near $-180^\\circ$, $|1 + L|$ gets TINY and $|S|$ SPIKES above $1$, actually AMPLIFYING disturbances!',
          },
          {
            id: 'd',
            latex: 'L(j\\omega) = -1 \\implies |S(j\\omega)| = 0',
            correct: false,
            misconception:
              'At $L = -1$, the denominator $1 + L = 0$ blows $|S|$ up to $\\infty$ (instability!).',
          },
        ],
        lockedLabel: 'Disturbance Rule',
        lockedResultLatex: '\\textcolor{#34D399}{|L(j\\omega)| \\gg 1 \\implies |S(j\\omega)| \\ll 1} \\;\\;(\\text{low }\\omega)',
        hint: 'Check what makes $\\frac{1}{|1 + L|}$ very small.',
      },
      {
        stepType: 'noise_attenuation',
        badge: 'High-Freq Sensor Noise Rejection',
        whyThisStep:
          'Sensor measurement noise $N(s)$ enters the output via $Y(s) = -T(s)N(s)$ — forcing loop gain to roll off cleanly above crossover so noisy encoders don\'t shake the actuator.',
        systemImpact:
          'Ensuring $|L(j\\omega)| \\ll 1$ above crossover makes $|T(j\\omega)| \\approx |L(j\\omega)| \\ll 1$, filtering out high-frequency ADC and encoder jitter.',
        prompt:
          'Since sensor noise $N(s)$ enters output via $Y(s) = -T(s)N(s)$, what high-frequency loop-shaping condition ensures $|T(j\\omega)| \\ll 1$?',
        highlightLatex:
          '|T(j\\omega)| = \\frac{|\\textcolor{#22D3EE}{L(j\\omega)}|}{|1 + \\textcolor{#22D3EE}{L(j\\omega)}|} \\ll 1',
        options: [
          {
            id: 'a',
            latex: '|L(j\\omega)| \\gg 1 \\implies |T(j\\omega)| \\ll 1',
            correct: false,
            misconception:
              'When $|L| \\gg 1$, $T = \\frac{L}{1+L} \\approx 1$ — meaning the loop blindly tracks $100\\%$ of the sensor noise!',
          },
          {
            id: 'b',
            latex: '|L(j\\omega)| \\ll 1 \\implies |T(j\\omega)| \\ll 1',
            correct: true,
          },
          {
            id: 'c',
            latex: '|S(j\\omega)| \\ll 1 \\implies |T(j\\omega)| \\ll 1',
            correct: false,
            misconception:
              'Impossible! Since $S + T = 1$, making $|S| \\ll 1$ forces $T \\approx 1$ (and vice versa).',
          },
          {
            id: 'd',
            latex: '\\angle L(j\\omega) = -180^\\circ \\implies |T(j\\omega)| \\ll 1',
            correct: false,
            misconception:
              'Noise rejection requires small MAGNITUDE $|L| \\ll 1$ at high frequency regardless of phase.',
          },
        ],
        lockedLabel: 'Noise Rule',
        lockedResultLatex: '\\textcolor{#34D399}{|L(j\\omega)| \\ll 1 \\implies |T(j\\omega)| \\ll 1} \\;\\;(\\text{high }\\omega)',
        hint: 'Check when $\\frac{|L|}{|1+L|} \\approx |L|$ becomes very small.',
      },
      {
        stepType: 'ms_nyquist_dist',
        badge: 'Peak Sensitivity Ms & Nyquist Distance',
        whyThisStep:
          'GM and PM alone can miss a loop that sneaks dangerously close to $-1$ at a diagonal angle — peak sensitivity $M_s$ is the single true Euclidean margin to instability!',
        systemImpact:
          'Because $d_{\\min} = 1/M_s$ is the exact radius of the largest circle around $-1 + j0$ excluded by the Nyquist curve, bounding $M_s$ guarantees robustness against simultaneous gain AND phase errors!',
        prompt:
          'Relate peak sensitivity $M_s = \\max_\\omega |S(j\\omega)| = \\max_\\omega \\frac{1}{|1 + L(j\\omega)|}$ to the minimum Euclidean distance $d_{\\min} = \\min_\\omega |L(j\\omega) - (-1)|$ from the Nyquist curve to $-1 + j0$.',
        highlightLatex:
          '|1 + L(j\\omega)| = |\\textcolor{#22D3EE}{L(j\\omega)} - (\\textcolor{#F59E0B}{-1})| \\implies M_s = \\max_\\omega \\frac{1}{d(\\omega)}',
        options: [
          {
            id: 'a',
            latex: 'd_{\\min} = M_s',
            correct: false,
            misconception:
              'Inverse relationship! Larger peak sensitivity $M_s$ means the Nyquist plot came CLOSER to $-1$ (smaller $d_{\\min}$).',
          },
          {
            id: 'b',
            latex: 'd_{\\min} = 1 - M_s',
            correct: false,
            misconception:
              'Since $M_s \\ge 1$ normally, $1 - M_s$ would be negative; $M_s = 1/d_{\\min}$ gives $d_{\\min} = 1/M_s > 0$.',
          },
          {
            id: 'c',
            latex: 'd_{\\min} = \\frac{1}{M_s} \\;\\;(\\text{distance to }-1)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'd_{\\min} = \\frac{1}{1 + M_s}',
            correct: false,
            misconception:
              'Notice $1 + L = L - (-1)$ IS the distance directly, so $|S| = 1/d$ and therefore $\\min d = 1 / \\max|S| = 1/M_s$.',
          },
        ],
        lockedLabel: 'Nyquist Margin',
        lockedResultLatex: 'd_{\\min} = \\textcolor{#34D399}{\\frac{1}{M_s}} \\;\\;(\\text{radius around }-1)',
        hint: 'Take the maximum of $1/d(\\omega)$, which occurs at the minimum of $d(\\omega)$.',
      },
      {
        stepType: 'ms_bound_margins',
        badge: 'Guaranteed Margins from Ms ≤ 1.6',
        whyThisStep:
          'Modern control engineers specify $M_s \\le 1.6$ (or $1.4\\text{–}2.0$) as one compact robustness target because a single circle around $-1$ mathematically enforces BOTH Gain and Phase Margin floors!',
        systemImpact:
          'Keeping $M_s \\le 1.6$ ($+4.1\\text{ dB}$ max disturbance amplification) automatically guarantees $\\text{GM} \\ge 2.67$ ($+8.5\\text{ dB}$) AND $\\text{PM} \\ge 36.4^\\circ$ — bulletproof robustness!',
        prompt:
          'Using the exact circle-exclusion bounds $\\text{GM} \\ge \\frac{M_s}{M_s - 1}$ and $\\text{PM} \\ge 2\\arcsin\\!\\left(\\frac{1}{2M_s}\\right)$, evaluate the minimum guaranteed GM and PM when $M_s = 1.6$.',
        highlightLatex:
          '\\text{GM} \\ge \\frac{\\textcolor{#F59E0B}{1.6}}{\\textcolor{#F59E0B}{1.6} - 1}, \\qquad \\text{PM} \\ge 2\\arcsin\\!\\left(\\frac{1}{2\\cdot\\textcolor{#F59E0B}{1.6}}\\right)',
        options: [
          {
            id: 'a',
            latex: '\\text{GM} \\ge 1.6 \\;(+4.1\\text{ dB}), \\qquad \\text{PM} \\ge 18.2^\\circ',
            correct: false,
            misconception:
              'Compute $1.6 / (1.6 - 1) = 1.6/0.6 = 2.67$ ($+8.5\\text{ dB}$) and $2\\arcsin(0.3125) \\approx 2(18.2^\\circ) = 36.4^\\circ$!',
          },
          {
            id: 'b',
            latex: '\\text{GM} \\ge 2.67 \\;(+8.5\\text{ dB}), \\qquad \\text{PM} \\ge 36.4^\\circ',
            correct: true,
          },
          {
            id: 'c',
            latex: '\\text{GM} \\ge 0.625 \\;(-4.1\\text{ dB}), \\qquad \\text{PM} \\ge 36.4^\\circ',
            correct: false,
            misconception:
              '$1/1.6 = 0.625$ is the exclusion radius $d_{\\min}$, so the negative-axis intercept can be no closer than $-1 + 0.625 = -0.375$, giving $\\text{GM} \\ge 1/0.375 = 2.67$!',
          },
          {
            id: 'd',
            latex: '\\text{GM} \\ge 2.67 \\;(+8.5\\text{ dB}), \\qquad \\text{PM} \\ge 60.0^\\circ',
            correct: false,
            misconception:
              '$\\text{PM} \\ge 60^\\circ$ requires $M_s = 1.0$ ($2\\arcsin(0.5) = 60^\\circ$); at $M_s = 1.6$, $2\\arcsin(1/3.2) \\approx 36.4^\\circ$.',
          },
        ],
        lockedLabel: 'Ms = 1.6 Guarantee',
        lockedResultLatex: '\\text{GM} \\ge \\textcolor{#34D399}{2.67\\;(+8.5\\text{ dB})}, \\quad \\text{PM} \\ge \\textcolor{#34D399}{36.4^\\circ}',
        hint: 'Compute $1.6/0.6 \\approx 2.67$ and $2\\arcsin(0.3125) \\approx 36.4^\\circ$.',
      },
    ],
  },

  {
    id: 'frq4-nyquist-rhp',
    tier: 'robustness',
    tierLabel: 'Margins & Sensitivity',
    title: 'Nyquist Criterion for Open-Loop Unstable Plant',
    mechatronicsContext:
      'Active magnetic levitation bearings and inverted pendulums are open-loop unstable ($P > 0$); standard Bode stability rules fail completely here, making the full Nyquist encirclement criterion mandatory.',
    expressionLatex: 'L(s)=\\frac{K}{s-2} \\;\\;(P=1\\text{ RHP Pole})',
    finalAnswerLatex:
      'P=1 \\implies N=-1\\;(\\text{1 CCW}) \\iff -\\frac{K}{2} < -1 \\iff K > 2 \\;\\;(s_{\\text{CL}}=2-K)',
    verifyPlot: {
      kind: 'nyquist-circle',
      bounds: { minRe: -3.2, maxRe: 0.8, minIm: -1.8, maxIm: 1.8 },
      kMin: 0.6,
      kMax: 5.5,
      kCrit: 2.0,
      defaultCursor: 0.55,
      subtitle:
        'Hover or drag horizontally to sweep gain $K \\in [0.6, 5.5]$: watch the Nyquist circle expand leftward — only when $K > 2$ does it swallow $-1 + j0$ with $N = -1$ (1 CCW encirclement), canceling $P = 1$ to achieve $Z = 0$ stability!',
      domainMeta: 'Interactive Nyquist Plane · Drag K ∈ [0.6, 5.5] · Critical K = 2',
      metrics: [
        { label: 'OL RHP Poles P', value: 'P = 1 (at s = +2)' },
        { label: 'Required N', value: 'N = −1 (1 CCW loop)' },
        { label: 'Real Crossing', value: 'L(0) = −K/2 < −1' },
        { label: 'Stable Range', value: 'K > 2 (s_CL = 2−K) ✓' },
      ],
    },
    steps: [
      {
        stepType: 'count_p',
        badge: 'Count Open-Loop RHP Poles P',
        whyThisStep:
          'Before plotting a single frequency point, counting open-loop RHP poles $P$ tells you immediately whether simple Bode stability rules even apply — if $P > 0$, they DO NOT!',
        systemImpact:
          'With $P = 1$ (an exponentially diverging mode $e^{+2t}$), leaving the loop open or setting gain too low causes immediate crash/rail saturation.',
        prompt:
          'Inspect $L(s) = \\frac{K}{s - 2}$ and state the number $P$ of open-loop poles in the unstable Right Half-Plane ($\\operatorname{Re} s > 0$).',
        highlightLatex:
          'L(s) = \\frac{K}{\\textcolor{#F59E0B}{s - 2}} \\implies s_{\\text{OL}} = +2',
        options: [
          {
            id: 'a',
            latex: 'P = 0 \\;\\;(\\text{open-loop stable})',
            correct: false,
            misconception:
              'Setting the denominator $s - 2 = 0$ yields $s = +2 > 0$, which sits strictly in the unstable RHP ($P = 1$).',
          },
          {
            id: 'b',
            latex: 'P = 1 \\;\\;(\\text{open-loop pole at } s = +2)',
            correct: true,
          },
          {
            id: 'c',
            latex: 'P = 2 \\;\\;(\\text{two RHP poles})',
            correct: false,
            misconception:
              'The denominator $(s - 2)$ is first-order, so there is only ONE open-loop pole (located at $+2$, not multiplicity $2$).',
          },
          {
            id: 'd',
            latex: 'P = -1',
            correct: false,
            misconception:
              '$P$ is a non-negative count of open-loop RHP poles ($P \\ge 0$); here $P = 1$.',
          },
        ],
        lockedLabel: 'Open-Loop RHP P',
        lockedResultLatex: 'P = \\textcolor{#34D399}{1} \\;\\;(\\text{pole at } s = +2)',
        hint: 'Find the roots of $s - 2 = 0$ with positive real part.',
      },
      {
        stepType: 'nyquist_znp',
        badge: 'Required Encirclements N',
        whyThisStep:
          'Cauchy\'s Argument Principle ($Z = N + P$) turns the Nyquist plot into an exact closed-loop pole counter — showing how encirclements of $-1$ can cancel open-loop RHP poles to restore stability!',
        systemImpact:
          'Unlike open-loop stable plants (where encircling $-1$ spells doom), here you REQUIRE $N = -1$ (one CCW loop around $-1$) to pull the RHP pole back into the LHP!',
        prompt:
          'Apply the Nyquist formula $Z = N + P$ (with $N$ = clockwise encirclements of $-1 + j0$, $Z$ = closed-loop RHP poles). With $P = 1$, what $N$ is required for closed-loop stability ($Z = 0$)?',
        highlightLatex:
          '\\textcolor{#34D399}{Z} = \\textcolor{#F59E0B}{N} + \\textcolor{#22D3EE}{P}, \\qquad \\text{want } Z = 0\\text{ with } P = 1',
        options: [
          {
            id: 'a',
            latex: 'N = 0 \\;\\;(\\text{must NOT encircle }-1)',
            correct: false,
            misconception:
              'If $N = 0$, then $Z = 0 + 1 = 1$, leaving ONE closed-loop pole stuck in the unstable RHP!',
          },
          {
            id: 'b',
            latex: 'N = +1 \\;\\;(\\text{1 CW encirclement of }-1)',
            correct: false,
            misconception:
              'One CLOCKWISE encirclement ($N = +1$) gives $Z = 1 + 1 = 2$ unstable poles — making things even worse!',
          },
          {
            id: 'c',
            latex: 'N = -1 \\;\\;(\\text{1 CCW encirclement of }-1)',
            correct: true,
          },
          {
            id: 'd',
            latex: 'N = -2 \\;\\;(\\text{2 CCW encirclements of }-1)',
            correct: false,
            misconception:
              '$Z = N + P$ can never be negative; $0 = N + 1$ uniquely requires $N = -1$ (exactly one CCW encirclement).',
          },
        ],
        lockedLabel: 'Required N',
        lockedResultLatex: 'N = \\textcolor{#34D399}{-1} \\;\\;(\\text{1 CCW encirclement of }-1+j0)',
        hint: 'Solve $0 = N + 1$ for $N$ (where negative $N$ means counter-clockwise).',
      },
      {
        stepType: 'map_ljw',
        badge: 'Map L(jω) onto Complex Plane',
        whyThisStep:
          'Separating $L(j\\omega)$ into real and imaginary coordinates traces the exact Nyquist locus and locates its real-axis crossing without guessing.',
        systemImpact:
          'As $\\omega$ runs $0 \\to +\\infty$, $L(j\\omega)$ starts at $(-K/2, 0)$ and curves through Quadrant III (negative imag) up to the origin — so the full $\\omega \\in (-\\infty, +\\infty)$ mirror image forms a clean CCW circle spanning $[-K/2, 0]$!',
        prompt:
          'Rationalize $L(j\\omega) = \\frac{K}{-2 + j\\omega}$ into real and imaginary parts, and evaluate the real-axis intercept at $\\omega = 0$.',
        highlightLatex:
          'L(j\\omega) = \\frac{K}{\\textcolor{#22D3EE}{-2 + j\\omega}} \\cdot \\frac{-2 - j\\omega}{-2 - j\\omega}',
        options: [
          {
            id: 'a',
            latex: 'L(j\\omega) = \\frac{K(-2 - j\\omega)}{4 + \\omega^2}, \\qquad L(0) = -\\frac{K}{2}',
            correct: true,
          },
          {
            id: 'b',
            latex: 'L(j\\omega) = \\frac{K(2 - j\\omega)}{4 + \\omega^2}, \\qquad L(0) = +\\frac{K}{2}',
            correct: false,
            misconception:
              'Check the sign at $\\omega = 0$: $L(0) = \\frac{K}{0 - 2} = -\\frac{K}{2}$ (strictly NEGATIVE real axis!).',
          },
          {
            id: 'c',
            latex: 'L(j\\omega) = \\frac{K(-2 + j\\omega)}{4 + \\omega^2}, \\qquad L(0) = -\\frac{K}{2}',
            correct: false,
            misconception:
              'The complex conjugate of $(-2 + j\\omega)$ is $(-2 - j\\omega)$, putting $-j\\omega$ in the numerator (so $\\omega > 0$ lies in the LOWER half-plane, sweeping CCW!).',
          },
          {
            id: 'd',
            latex: 'L(j\\omega) = \\frac{K(-2 - j\\omega)}{4 - \\omega^2}, \\qquad L(0) = -\\frac{K}{2}',
            correct: false,
            misconception:
              'Multiplying conjugates gives $(-2)^2 - (j\\omega)^2 = 4 - (-\\omega^2) = 4 + \\omega^2$ (always positive!).',
          },
        ],
        lockedLabel: 'Nyquist Curve',
        lockedResultLatex: 'L(j\\omega) = \\textcolor{#34D399}{\\frac{K(-2-j\\omega)}{4+\\omega^2}}, \\quad L(0) = \\textcolor{#34D399}{-\\frac{K}{2}}',
        hint: 'Multiply top and bottom by the complex conjugate $(-2 - j\\omega)$.',
      },
      {
        stepType: 'encircle_cond',
        badge: 'Exact Stabilizing Gain Range',
        whyThisStep:
          'Reading the stabilization threshold straight off the real-axis intercept shows how Nyquist handles BOTH lower AND upper gain margins effortlessly.',
        systemImpact:
          'You MUST keep $K > 2$ (a LOWER gain margin — letting gain drop below $2$ crashes the maglev!), while ANY $K > 2$ keeps $-1$ safely inside the CCW circle!',
        prompt:
          'Since the CCW Nyquist circle spans the real-axis diameter $[-K/2,\\, 0]$, what exact condition on $K > 0$ encloses $-1 + j0$ strictly inside the loop ($N = -1$)?',
        highlightLatex:
          '\\text{Leftmost intercept } \\textcolor{#22D3EE}{-\\frac{K}{2}} \\text{ must sit LEFT of } \\textcolor{#F59E0B}{-1}',
        options: [
          {
            id: 'a',
            latex: '-\\frac{K}{2} > -1 \\implies 0 < K < 2',
            correct: false,
            misconception:
              'For $0 < K < 2$, the circle stops SHORT of $-1$ (giving $N = 0, Z = 1$ — UNSTABLE!); it must extend PAST $-1$ to the left!',
          },
          {
            id: 'b',
            latex: '-\\frac{K}{2} < -1 \\implies K > 2',
            correct: true,
          },
          {
            id: 'c',
            latex: '-\\frac{K}{2} < -1 \\implies K > 1',
            correct: false,
            misconception:
              'Multiply both sides of $-K/2 < -1$ by $-2$ (flipping the inequality): $K > 2$.',
          },
          {
            id: 'd',
            latex: '\\text{Unstable for ALL } K > 0',
            correct: false,
            misconception:
              'As soon as $K > 2$, $-1$ sits strictly inside the CCW Nyquist circle ($N = -1$), stabilizing the loop!',
          },
        ],
        lockedLabel: 'Nyquist Bound',
        lockedResultLatex: '\\textcolor{#34D399}{-\\frac{K}{2} < -1 \\implies K > 2}',
        hint: 'Require $-K/2 < -1$ so $-1$ lies strictly inside $[-K/2, 0]$.',
      },
      {
        stepType: 'algebraic_verify',
        badge: 'Algebraic Pole Verification',
        whyThisStep:
          'Cross-checking a graphical Nyquist result against the exact closed-loop pole builds rock-solid trust in Cauchy\'s criterion before you tackle high-order or time-delayed unstable plants where algebra alone fails.',
        systemImpact:
          'The exact closed-loop pole $s_{\\text{CL}} = 2 - K$ crosses from RHP to LHP right at $K = 2$ — confirming Nyquist\'s prediction $K > 2$ with 100% mathematical fidelity!',
        prompt:
          'Verify the Nyquist criterion by solving the closed-loop characteristic equation $1 + \\frac{K}{s - 2} = 0$ directly for $s_{\\text{CL}}$.',
        highlightLatex:
          '1 + \\frac{\\textcolor{#F59E0B}{K}}{\\textcolor{#22D3EE}{s - 2}} = 0 \\implies s_{\\text{CL}} < 0',
        options: [
          {
            id: 'a',
            latex: 's_{\\text{CL}} = 2 + K < 0 \\iff K < -2',
            correct: false,
            misconception:
              'Solving $(s - 2) + K = 0$ gives $s = 2 - K$ (not $2 + K$).',
          },
          {
            id: 'b',
            latex: 's_{\\text{CL}} = K - 2 < 0 \\iff K < 2',
            correct: false,
            misconception:
              'Move both $-2$ and $+K$ to the right side carefully: $s = 2 - K$, which is negative when $K > 2$.',
          },
          {
            id: 'c',
            latex: 's_{\\text{CL}} = 2 - K < 0 \\iff K > 2',
            correct: true,
          },
          {
            id: 'd',
            latex: 's_{\\text{CL}} = -2 - K < 0 \\iff K > 0',
            correct: false,
            misconception:
              'The open-loop pole is at $+2$ (denominator $s - 2$), not $-2$, so $s - 2 + K = 0 \\implies s = 2 - K$.',
          },
        ],
        lockedLabel: 'Pole Verification',
        lockedResultLatex: 's_{\\text{CL}} = \\textcolor{#34D399}{2 - K < 0 \\iff K > 2} \\;\\;(\\text{matches Nyquist!})',
        hint: 'Multiply $1 + \\frac{K}{s-2} = 0$ by $(s-2)$ and isolate $s$.',
      },
    ],
  },
];
