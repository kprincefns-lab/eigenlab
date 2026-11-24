# EIGENLAB — Physical AI & Robotics Skill-Graph Roadmap

EIGENLAB is structured as a **Two-Tier Prerequisite-to-Frontier DAG** (`js/data/dag-curriculum.js`) linking **25 Pruned Invariant Engineering Foundations** (`F1`–`F8`) directly to **12 Bleeding-Edge Physical AI & Robotics Labs** (`M1`–`M5`).

Every node is designed around **first-principles physical intuition, live telemetry, and an explicit "Break the System" adversarial failure mode**—never rote textbook drills.

---

## Completed: Vertical Slice 1 (Live)

Vertical Slice 1 establishes the interactive DAG Skill Graph, bridges core foundational math and controls to frontier robotics, and ships **3 Flagship Frontier Labs** alongside the full **9-Studio Review Vault**.

### Flagship Frontier Labs & Migrated Bridge Nodes
| Node | Title | Route / Status | Core Interactive Mechanic & Break Mode |
| :--- | :--- | :--- | :--- |
| **`F1.1`** | Derivatives, Gradients & Loss Landscapes | **Migrated + Frontier Bridge** (`calc-derivatives` → `M1.2`, `M3.1`) | 3D secant-to-tangent limit studio bridged directly to backpropagation, score fields, and smooth SDF contact gradients. |
| **`F1.2`** | Jacobians, SVD & Manipulability Ellipsoids | **Flagship Lab** (`frontier-lab: F1.2` + `mech-kinematics`) | Live 3D/planar manipulator SVD ellipsoid, Yoshikawa $w(q)$, $\kappa(J)$, and DLS regularization. **Break Mode:** drive $q_2 \to 0$ with $\lambda = 0$ to watch $\sigma_{\min} \to 0$ and joint velocity explode. |
| **`M1.1`** | Why Regression Fails: Multimodal Action Averaging | **Flagship Lab** (`frontier-lab: M1.1`) | Head-to-head L2/MSE behavioral cloning vs. multimodal generative sampling (Diffusion / Flow Matching). **Break Mode (*Symmetric Bimodal Trap*):** center the obstacle with 50/50 left-right demos and run MSE regression to trigger mode-averaging collision. |
| **`M4.1`** | Control Barrier Functions (CBFs) Wrapping Stochastic AI Policies | **Flagship Lab** (`frontier-lab: M4.1`) | Real-time 1 kHz deterministic CBF-QP shield enforcing $L_f h + L_g h\,u + \alpha(h) \ge 0$ around a noisy AI policy. **Break Mode (*Disable CBF + 40ms Latency*):** strip the QP shield and inject 40 ms bus lag + policy noise to breach $h(x) < 0$. |

### Preserved 9-Studio Review Vault (Mapped to DAG Foundations)
All 9 existing interactive 3D/2D + Step-Solver studios remain live and directly accessible both from the Review Vault and via Tier 1 DAG launch targets:
- **Mathematics (4):** `calc-derivatives` (`F1.1`), `calc-integrals`, `math-diff-eq`, `math-lin-alg`
- **Mechatronics & Control Systems (5):** `mech-modeling`, `mech-pid` (`F6.2`), `mech-root-bode` (`F4.2`), `mech-state-space` (`F4.3` `kf-fusion`, `F6.1` `lqr-cart`, `F6.4` `mpc-cbf`), `mech-kinematics` (`F1.2` companion, `F1.3` `solver`)

---

## Architectural & SOTA Engineering Notes

### 1. Why Zero-Build Native ES Modules + Three.js / Canvas2D
- **60 FPS Zero-Thrash Loop:** Direct `requestAnimationFrame` loops driving typed `Float32Array` state buffers, pre-allocated Three.js geometries/matrices, and high-DPI Canvas2D oscilloscopes avoid virtual-DOM reconciliation jitter and GC pauses during 1 kHz physics sub-stepping.
- **Deterministic Sub-Stepping:** Each lab runs fixed-dt physics/control integrators (e.g., $\Delta t = 1\text{ ms}$ virtual ticks) decoupled from display refresh rate, preserving accurate phase margins, delay buffers, and CBF-QP barrier invariance across 60 Hz and 120 Hz monitors.
- **Instant Deployment:** Native browser ES Modules with an Import Map (`three@0.170.0`, `KaTeX@0.19.1`) require zero bundler, zero `node_modules`, and deploy straight from static hosting (Vercel / Cloudflare Pages).

### 2. SOTA Upgrades Over Classical Engineering Syllabi
EIGENLAB deliberately replaces outdated textbook algorithms with the formulations deployed on modern humanoids, quadrupeds, and dexterous manipulators:

| Classical Syllabus | EIGENLAB SOTA Replacement | Why It Matters on Real Robots |
| :--- | :--- | :--- |
| Linearized EKF & Euler-angle pose subtraction | **UKF Sigma Points, Lie-Group InEKF ($SE_2(3)$), & GTSAM/MHE Factor Graphs** (`F1.3`, `F4.3`) | Eliminates gimbal lock, maintains covariance consistency ($\text{NEES}$), and preserves pose uncertainty on curved manifolds. |
| 100-step DDPM / MSE Regression | **Conditional Flow Matching (1–4 NFE) + Action Chunking (ACT / $\pi_0$) with Temporal Ensembling** (`M1.1`, `M1.2`) | Preserves multimodal action distributions while cutting inference latency from $>100\text{ ms}$ down to real-time 20 Hz control budgets. |
| Monolithic end-to-end joint commands or stiff PID | **Hierarchical 20 Hz VLA (System 2) → 1000 Hz Operational-Space WBC / Impedance + CBF-QP Shield (System 1)** (`F6.3`, `M1.3`, `M4.1`) | Separates semantic planning from hard real-time dynamics, compliance, and mathematically guaranteed forward-invariant safety. |
| Rigid-body DH tables & penalty springs | **Product of Exponentials (PoE) Screw Theory, QP-IK (Pink/Mink), & Smooth SDF Contact Gradients** (`F1.2`, `F1.3`, `M3.1`) | Singularity-robust kinematics and differentiable contact formulations ready for GPU-accelerated physics (MJX / Warp). |

---

## Upcoming Delivery Slices

### Slice 2 — Signals + Embedded Determinism + Sim-to-Real
**Core Spine:** `F4.2` (Phase Lag & Group Delay) $\to$ `F5.1` (RTOS & DMA Jitter) $\to$ `M3.2` (Sim-to-Real Gap)
- **Supporting Nodes:** `F1.4` (Score Fields), `F4.1` (Aliasing), `F5.2` (CAN-FD / EtherCAT / MIPI Bandwidth), `F6.3` (Impedance Control), `F7.1` (Inertia & Coriolis), `F7.3` (Modal Resonance), `M1.2` (Flow Matching & Action Chunking), `M1.3` (20 Hz VLA $\to$ 1 kHz WBC), `M4.2` (Adversarial Eval Harness).
- **Flagship Experience (`M3.2`):** Interactive Sim-to-Real split-viewport rig where a policy trained at 0 ms delay with rigid links is deployed onto a live hardware twin with tunable transport latency ($\Delta\text{PM} = \omega_{gc}\tau$), gearbox backlash, payload inertia drift, and 24 Hz structural flex—demonstrating why latency/backlash randomization beats naive visual DR.

### Slice 3 — Power + Compute + Thermal Physical Co-Design
**Core Spine:** `F2.2` (3-Phase FOC & Regen Back-EMF) $\to$ `F3.3` (Quantization Physics) $\to$ `F8.1` (Thermal RC Networks) $\to$ `M5.1` (QDD Actuator Co-Design) & `M5.2` (Edge AI Compute Envelopes)
- **Supporting Nodes:** `F2.1` (Switching PDN Ripple), `F2.3` (Ground Loops & EMI), `F3.1` (Timing & Metastability), `F3.2` (Memory Wall & Roofline), `F8.2` (Liquid Cooling & $v^2$ Drag).
- **Flagship Experiences (`M5.1`, `M5.2`):**
  - **QDD Co-Design Workbench (`M5.1`):** Sweep planetary ratio $N$ (3:1–80:1), motor constant $K_m$, and bus voltage to visualize the Pareto front between reflected impact inertia ($N^2 J_m$), peak torque, and $I^2 R(T)$ winding thermal runaway.
  - **Edge AI Roofline & Thermal Envelope (`M5.2`):** Coupled SRAM/HBM bandwidth, FP16/FP8/INT4 quantization SQNR, and 45 W–150 W heatsink thermal throttling simulator showing when a 7B VLA drops below 20 Hz.

### Slice 4 — Contact Mechanics + Differentiable Physics + Parallel Manipulators
**Core Spine:** `F7.2` (Friction Cones & Impulses) $\to$ `M3.1` (SDFs & Smooth Contact Gradients) $\to$ `M3.3` (Tactile Latent Spaces) + **`mech-parallel-kinematics`**
- **Supporting Nodes:** `F7.4` (Soft Elastomers), `M2.1` (Pixel Rollouts vs. JEPA Latent World Models), `M2.2` (Compounding Horizon Error & Compute Budgets).
- **Flagship Experiences:**
  - **Differentiable Contact & Tactile Lab (`M3.1` / `M3.3`):** Live 3D Signed Distance Field slicer with adjustable smoothing $\epsilon$ exposing the gradient-explosion vs. ghost-tunneling trade-off, coupled with a visuotactile elastomer shear field for blind peg-in-hole slip recovery.
  - **Parallel Robotic Manipulators Studio (`mech-parallel-kinematics`):** Closed-chain 3-DOF Delta robots, planar 5-bar linkages, and 6-DOF Stewart-Gough hexapods—closed-form IK, Newton-Raphson FK, Type-I/Type-II parallel singularities, and reciprocal screw loop-closure constraints.

---

## Strictly Excluded Textbook Drills

To keep EIGENLAB laser-focused on **invariant physical understanding and modern robotics engineering**, the following legacy paper-and-pencil drills are **permanently excluded** from the curriculum:

1. **Manual integration technique tables** (obscure trig-sub / rational partial-fraction algebra marathons) — replaced by intuition for accumulation, numerical quadrature, and automatic differentiation.
2. **Hand-plotted asymptotic Bode & Root Locus sketching** — replaced by live 3D $|G(s)|$ slicing, delay-margin erosion ($\Delta\text{PM} = \omega_{gc}\tau$), and sensitivity peak $M_s$ analysis.
3. **Routh-Hurwitz tabular array arithmetic** — replaced by direct eigenvalue inspection, Lyapunov energy certificates $V(x)$, and CBF forward invariance $h(x)$.
4. **5-variable Karnaugh map (K-map) minimization** — replaced by setup/hold timing closure, CDC metastability, Roofline memory-wall analysis, and low-bit quantization physics.
5. **Manual 6-DOF Denavit-Hartenberg (DH) matrix multiplication algebra** — replaced by Product of Exponentials (PoE) screw twists on $SE(3)$, SVD manipulability, and QP-IK.
6. **Compass-and-straightedge Mohr's circle drafting** — replaced by inertia tensors, modal eigenfrequencies, friction cones, and hyperelastic strain fields.
7. **Static Moody chart & Heisler chart lookups** — replaced by dynamic Cauer/Foster thermal RC networks, transient duty-cycle derating, active cooling loops, and $v^2$/$v^3$ aerodynamic drag scaling.
