# EIGENLAB — Interactive 3D Engineering Studio

**EIGENLAB** is a Spline-inspired, zero-build interactive WebGL/Three.js engineering review and deep-learning web app crafted for a Mechatronics Engineer expanding into Theoretical Physics, AI, and advanced STEM.

Built with native HTML5 ES Modules, Three.js (`0.170.0`) via jsDelivr Import Map, KaTeX (`0.19.1`), and Tailwind CSS CDN—no `npm`, Node, Vite, or bundler required.

---

## Live Studio Highlights (Lesson 01: Derivatives)

1. **3D Limit & Tangent Lab (`js/viz/derivative-3d.js`)**
   - Full Three.js studio lighting using procedural `RoomEnvironment` + `PMREMGenerator`, `ACESFilmicToneMapping`, `MeshPhysicalMaterial`, `UnrealBloomPass`, and damped `OrbitControls` with 1-click camera presets (`3D Studio`, `Front 2D Graph`, `Isometric`).
   - Interactive secant-to-tangent limit mechanic ($\Delta x \to 0$) with glowing 3D rise/run triangle, toggleable 3D derivative curve $f'(x)$, pulsing critical-point beacons, and a live 3D **Mechatronics Linear Actuator** when the **Mechatronics Lens** is toggled ON.
2. **Curve & Derivative Intuition (`js/viz/stacked-graphs.js`)**
   - Synchronized high-DPI stacked graphs for $f(x)$, $f'(x)$, and $f''(x)$ (dynamically relabeling to Position $x(t)$, Velocity $v(t)$, and Acceleration $a(t)$ in Mechatronics Lens) with one unified draggable cursor.
   - Brilliant-style **"Match the Derivative"** 5-challenge visual intuition quiz with geometric proof overlays.
3. **Paperless Step Solver (`js/solver/step-solver.js`, `data/lessons/derivatives-problems.js`)**
   - 12 multi-step calculus problems spanning Power & Linearity, Trig & Exponential, Product, Quotient, and Chain/Combo rules.
   - Each problem decomposes into 3–5 atomic micro-steps with a pinned **Working Step Ledger**, color-coded KaTeX focus highlights, keyboard shortcuts (`1`–`4`, `H` for hint, `Enter` for next), misconception feedback, collapsible Formula Cheat Sheet, and an interactive dual-curve verification graph.
4. **Applied Word Problems (`data/lessons/derivatives-word-problems.json`)**
   - Schema-ready engineering problem queue primed for Mechatronics, Physics, and AI applications.

---

## Instant Deployment (Zero Build Step)

### Vercel
1. Import this repository in [Vercel](https://vercel.com/new).
2. Leave **Framework Preset** as `Other`.
3. Leave **Build Command** empty and **Output Directory** as `.` (root).
4. Click **Deploy** — live in seconds.

### Cloudflare Pages
1. Connect this repository in **Cloudflare Dashboard → Workers & Pages → Create → Pages**.
2. Set **Framework preset** to `None`.
3. Leave **Build command** empty and set **Build output directory** to `/`.
4. Click **Save and Deploy**.

### Local Preview
Serve the repository root with any static HTTP server (ES Modules require HTTP, not `file://`):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Extending the Curriculum

### 1. Adding New Lessons to `data/curriculum.json`
Each domain (`math`, `mechatronics`, `physics`, `ai`) holds an array of `lessons`. Flip `"status"` from `"planned"` to `"live"` (or append a new lesson object):

```json
{
  "id": "calc-integrals",
  "status": "live",
  "title": "Integrals, Accumulation & Flux",
  "tag": "Lesson 02 • 3D Interactive + Step Solver",
  "description": "Riemann sums, signed area, and flux across surfaces.",
  "estimatedMinutes": 25,
  "stages": ["3d-lab", "intuition", "solver", "word-problems"]
}
```

### 2. Adding Applied Word Problems to `data/lessons/derivatives-word-problems.json`
Stage 4 automatically reads `data/lessons/derivatives-word-problems.json`. Populate the `"problems"` array and update `"status"` to `"live"` to activate applied Mechatronics, Physics, and AI engineering problems:

```json
{
  "lessonId": "calc-derivatives",
  "status": "live",
  "plannedTopics": [
    "Servo Velocity & Acceleration Profiling",
    "Capacitor Current i(t) = C dv/dt",
    "Thermal Cooling Rates & Optimization",
    "Gradient Descent Loss Minimization"
  ],
  "problems": [
    {
      "id": "wp-servo-profile",
      "title": "Servo Velocity & Acceleration Profiling",
      "domain": "Mechatronics",
      "prompt": "A linear actuator follows x(t) = 2.5e^{-0.25t}\\sin(2t) mm...",
      "answerLatex": "v(t) = 2.5e^{-0.25t}(2\\cos(2t) - 0.25\\sin(2t))"
    }
  ]
}
```

---

## Project Structure

```text
eigenlab/
├── index.html                                  # Import Map, CDN links & app mount
├── manifest.json                               # Standalone PWA manifest
├── css/
│   └── studio.css                              # Spline dark glass design system
├── data/
│   ├── curriculum.json                         # Multi-discipline syllabus manifest
│   └── lessons/
│       ├── derivatives-problems.js             # 12 atomic multi-step calculus problems
│       └── derivatives-word-problems.json      # Applied word problems queue
└── js/
    ├── app.js                                  # Discipline Hub & Lesson 01 orchestrator
    ├── store.js                                # localStorage progress + Web Audio synth
    ├── viz/
    │   ├── derivative-3d.js                    # Spline-quality Three.js 3D studio
    │   └── stacked-graphs.js                   # Synchronized f/f'/f'' + Visual Quiz
    └── solver/
        └── step-solver.js                      # Paperless Working-Ledger Step Solver
```
