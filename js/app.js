/**
 * EIGENLAB — Unified Application Shell, Discipline Hub & Lesson 01 Orchestrator
 * Coordinates:
 *  - View 1: Discipline Hub (Home Dashboard + Ambient 3D Preview + Mastery Ring + 4-Domain Grid)
 *  - View 2: Lesson 01 (`calc-derivatives`) 4-Stage Interactive Studio
 *    1. 3D Limit & Tangent Lab (`3d-lab`)
 *    2. Curve & Derivative Intuition (`intuition`)
 *    3. Paperless Step Solver (`solver`)
 *    4. Applied Word Problems Queue (`word-problems`)
 */

import { store, sound, renderKatex } from './store.js';
import {
  Derivative3DStudio,
  FUNCTION_PRESETS,
  createAmbientHeroScene,
} from './viz/derivative-3d.js';
import { StackedDerivativeLab, VisualQuizEngine } from './viz/stacked-graphs.js';
import { PaperlessStepSolver } from './solver/step-solver.js';

// ---------------------------------------------------------------------------
// Constants & Fallback Data
// ---------------------------------------------------------------------------

const LESSON_ID = 'calc-derivatives';

const STAGES = [
  {
    id: '3d-lab',
    number: 1,
    icon: '🌐',
    shortLabel: '3D Limit Lab',
    label: '1. 3D Limit & Tangent Lab',
  },
  {
    id: 'intuition',
    number: 2,
    icon: '📈',
    shortLabel: 'Curve Intuition',
    label: '2. Curve & Derivative Intuition',
  },
  {
    id: 'solver',
    number: 3,
    icon: '🧮',
    shortLabel: 'Step Solver',
    label: '3. Paperless Step Solver',
  },
  {
    id: 'word-problems',
    number: 4,
    icon: '⚙️',
    shortLabel: 'Word Problems',
    label: '4. Applied Word Problems',
  },
];

const PLANNED_TOPIC_METADATA = {
  'Servo Velocity & Acceleration Profiling': {
    domain: 'Mechatronics',
    accent: 'amber',
    equation: 'v(t) = \\frac{dx}{dt}, \\quad a(t) = \\frac{d^2x}{dt^2}',
    summary:
      'Compute peak velocity, torque limits, and S-curve jerk constraints for a closed-loop robotic actuator.',
  },
  'Capacitor Current i(t) = C dv/dt': {
    domain: 'Electronics',
    accent: 'cyan',
    equation: 'i(t) = C\\,\\frac{dv(t)}{dt}',
    summary:
      'Relate voltage ramp rates across power-rail decoupling capacitors to transient surge current.',
  },
  'Thermal Cooling Rates & Optimization': {
    domain: 'Physics',
    accent: 'violet',
    equation: '\\frac{dT}{dt} = -k\\,(T - T_{\\text{amb}})',
    summary:
      'Model heatsink dissipation rates and optimize fin geometry for embedded compute modules.',
  },
  'Gradient Descent Loss Minimization': {
    domain: 'AI & ML',
    accent: 'emerald',
    equation: '\\theta_{k+1} = \\theta_k - \\eta\\,\\frac{d\\mathcal{L}}{d\\theta}',
    summary:
      'Use local derivative slopes to tune learning rates and converge cleanly across loss landscapes.',
  },
};

const FALLBACK_CURRICULUM = {
  brand: 'EIGENLAB',
  tagline: 'Interactive 3D Engineering & Deep-Learning Studio',
  domains: [
    {
      id: 'math',
      title: 'Engineering Mathematics',
      subtitle: 'Calculus, differential systems, and linear geometry.',
      accent: '#22D3EE',
      symbol: '∂/∂x',
      lessons: [
        {
          id: 'calc-derivatives',
          status: 'live',
          title: 'Derivatives & Instantaneous Rate of Change',
          tag: 'Lesson 01 • 3D Interactive + Step Solver',
          description:
            'Collapse secant chords into tangent vectors on live 3D surfaces, map curves to slopes, and master 12 symbolic rules.',
          estimatedMinutes: 25,
        },
        {
          id: 'calc-integrals',
          status: 'planned',
          title: 'Integrals, Accumulation & Flux',
          tag: 'Lesson 02 • Coming Next',
        },
      ],
    },
    {
      id: 'mechatronics',
      title: 'Mechatronics & Control Systems',
      subtitle: 'Closed-loop feedback, robotics, and electromechanical dynamics.',
      accent: '#F59E0B',
      symbol: 'G(s)',
      lessons: [
        {
          id: 'mech-pid',
          status: 'planned',
          title: 'PID Control & Feedback Stability',
          tag: 'Control Lab • Coming Next',
        },
      ],
    },
    {
      id: 'physics',
      title: 'Theoretical Physics',
      subtitle: 'Variational mechanics, fields, and quantum wave phenomena.',
      accent: '#A78BFA',
      symbol: '∇×E',
      lessons: [
        {
          id: 'phys-lagrangian',
          status: 'planned',
          title: 'Lagrangian & Hamiltonian Mechanics',
          tag: 'Analytical Mechanics • Coming Next',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI & Machine Learning',
      subtitle: 'Optimization landscapes, automatic differentiation, and attention.',
      accent: '#34D399',
      symbol: '∇L(θ)',
      lessons: [
        {
          id: 'ai-backprop',
          status: 'planned',
          title: 'Multivariable Gradients & Backpropagation',
          tag: 'Optimization • Coming Next',
        },
      ],
    },
  ],
};

const FALLBACK_WORD_PROBLEMS = {
  lessonId: 'calc-derivatives',
  status: 'coming_soon',
  plannedTopics: [
    'Servo Velocity & Acceleration Profiling',
    'Capacitor Current i(t) = C dv/dt',
    'Thermal Cooling Rates & Optimization',
    'Gradient Descent Loss Minimization',
  ],
  problems: [],
};

// ---------------------------------------------------------------------------
// Application Runtime State
// ---------------------------------------------------------------------------

const appState = {
  view: 'hub', // 'hub' | 'lesson'
  lessonId: LESSON_ID,
  stage: '3d-lab', // '3d-lab' | 'intuition' | 'solver' | 'word-problems'
  curriculum: FALLBACK_CURRICULUM,
  wordProblems: FALLBACK_WORD_PROBLEMS,
  lab: {
    presetId: null,
    x0: 0.6,
    dx: 1.15,
    cameraPreset: '3d',
    showDerivativeCurve: true,
    isAnimating: false,
  },
  telemetry: {
    x0: 0.6,
    dx: 1.15,
    fx0: 0,
    fx1: 0,
    secantSlope: 0,
    exactSlope: 0,
    tangentLocked: false,
  },
};

const activeInstances = {
  ambientHero: null,
  studio3D: null,
  stackedLab: null,
  quizEngine: null,
  stepSolver: null,
  cleanupFns: [],
};

// ---------------------------------------------------------------------------
// Store & Peer Interop Helpers
// ---------------------------------------------------------------------------

function normalizePresets() {
  if (!FUNCTION_PRESETS) return [];
  const list = Array.isArray(FUNCTION_PRESETS)
    ? FUNCTION_PRESETS
    : Object.entries(FUNCTION_PRESETS).map(([id, v]) => ({ id, ...v }));

  return list.map((p, idx) => ({
    id: p.id ?? p.key ?? `preset-${idx}`,
    name: p.name ?? p.label ?? p.title ?? `Preset ${idx + 1}`,
    mechatronicsLabel: p.mechatronicsLabel ?? null,
    latex: p.latex ?? p.formulaLatex ?? p.equation ?? 'f(x)',
    derivLatex: p.derivLatex ?? p.derivativeLatex ?? p.dfLatex ?? "f'(x)",
    mechLatex: p.mechLatex ?? p.mechatronicsLatex ?? null,
    mechDerivLatex: p.mechDerivLatex ?? p.mechatronicsDerivLatex ?? null,
    f: p.f ?? p.fn ?? p.eval ?? ((x) => x * x),
    df: p.df ?? p.dfn ?? p.deriv ?? ((x) => 2 * x),
    xMin: p.xMin ?? p.domain?.[0] ?? -3.0,
    xMax: p.xMax ?? p.domain?.[1] ?? 3.0,
    defaultX: p.defaultX ?? p.initialX ?? 0.6,
    raw: p,
  }));
}

function getActivePreset(presets) {
  if (!presets.length) return null;
  if (!appState.lab.presetId) {
    appState.lab.presetId = presets[0].id;
  }
  return presets.find((p) => p.id === appState.lab.presetId) || presets[0];
}

function getStoreState() {
  return typeof store?.getState === 'function'
    ? store.getState()
    : {
        completedStages: [],
        solvedProblems: [],
        solvedQuizzes: [],
        accuracyStreak: 0,
        activeLens: 'math',
        muted: false,
      };
}

function isMechatronicsLens() {
  return getStoreState().activeLens === 'mechatronics';
}

function isSoundMuted() {
  return Boolean(getStoreState().muted);
}

function playSfx(kind = 'tick') {
  if (!sound || isSoundMuted()) return;
  try {
    if (kind === 'tick') sound.playTick?.();
    else if (kind === 'snap') sound.playSnap?.();
    else if (kind === 'success') sound.playSuccess?.();
    else if (kind === 'error') sound.playGentleError?.();
  } catch {
    // Never interrupt interaction on Web Audio errors
  }
}

function getMasterySnapshot() {
  const s = getStoreState();
  const stats =
    typeof store?.getMasteryStats === 'function' ? store.getMasteryStats() : {};

  const solvedProblems =
    stats.solvedProblemsCount ??
    (Array.isArray(s.solvedProblems) ? s.solvedProblems.length : 0);
  const solvedVisual =
    stats.solvedQuizzesCount ??
    (Array.isArray(s.solvedQuizzes) ? s.solvedQuizzes.length : 0);
  const streak = stats.streak ?? s.accuracyStreak ?? 0;
  const completedStages = Array.isArray(s.completedStages) ? s.completedStages : [];
  const percent = Math.max(
    0,
    Math.min(100, Math.round(stats.overallPct ?? 0))
  );

  return {
    percent,
    solvedProblems,
    totalProblems: 12,
    solvedVisual,
    totalVisual: 5,
    streak,
    accuracyPct: stats.accuracyPct ?? 100,
    completedStages,
  };
}

function isStageDone(stageId) {
  return getStoreState().completedStages.includes(stageId);
}

function markStageDone(stageId) {
  if (!stageId || isStageDone(stageId)) return;
  store?.markStageComplete?.(stageId);
  updateLessonStageDotsUI();
}

function typesetMath(el, tex, displayMode = false) {
  if (!el) return;
  if (typeof renderKatex === 'function') {
    renderKatex(el, tex, displayMode);
  } else if (window.katex?.render) {
    window.katex.render(String(tex ?? ''), el, {
      displayMode: Boolean(displayMode),
      throwOnError: false,
      strict: false,
    });
  } else {
    el.textContent = String(tex ?? '');
  }
}

function syncSliderTrackFill(inputEl) {
  if (!inputEl) return;
  const min = parseFloat(inputEl.min || '0');
  const max = parseFloat(inputEl.max || '100');
  const val = parseFloat(inputEl.value || '0');
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  inputEl.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct)).toFixed(2)}%`);
}

function formatNum(n, digits = 3) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0.000';
  const cleaned = Math.abs(n) < 1e-9 ? 0 : n;
  return cleaned.toFixed(digits);
}

function formatSigned(n, digits = 2) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0.00';
  const cleaned = Math.abs(n) < 1e-9 ? 0 : n;
  return `${cleaned >= 0 ? '+' : ''}${cleaned.toFixed(digits)}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toMechatronicsFormula(tex, isDerivative = false) {
  if (!tex) return isDerivative ? 'v(t) = \\dot{x}(t)' : 'x(t)';
  return String(tex)
    .replace(/(?<![a-zA-Z\\])x(?![a-zA-Z])/g, 't')
    .replace(/f'\(t\)/g, 'v(t)')
    .replace(/f\(t\)/g, 'x(t)');
}

function resolveAccentKey(accentOrDomainId) {
  const val = String(accentOrDomainId ?? '').toLowerCase();
  if (val === 'amber' || val === 'mechatronics' || val === '#f59e0b') return 'amber';
  if (val === 'violet' || val === 'physics' || val === '#a78bfa') return 'violet';
  if (val === 'emerald' || val === 'ai' || val === '#34d399') return 'emerald';
  return 'cyan';
}

function getAccentClasses(accentOrDomainId) {
  const key = resolveAccentKey(accentOrDomainId);
  switch (key) {
    case 'amber':
      return {
        border: 'hover:border-amberGlow/45',
        badge: 'bg-amberGlow/15 text-amberGlow border-amberGlow/30',
        iconBg: 'bg-amberGlow/15 text-amberGlow border-amberGlow/30',
        glow: 'from-amberGlow/15 via-transparent to-transparent',
      };
    case 'violet':
      return {
        border: 'hover:border-violetGlow/45',
        badge: 'bg-violetGlow/15 text-violetGlow border-violetGlow/30',
        iconBg: 'bg-violetGlow/15 text-violetGlow border-violetGlow/30',
        glow: 'from-violetGlow/15 via-transparent to-transparent',
      };
    case 'emerald':
      return {
        border: 'hover:border-emeraldGlow/45',
        badge: 'bg-emeraldGlow/15 text-emeraldGlow border-emeraldGlow/30',
        iconBg: 'bg-emeraldGlow/15 text-emeraldGlow border-emeraldGlow/30',
        glow: 'from-emeraldGlow/15 via-transparent to-transparent',
      };
    case 'cyan':
    default:
      return {
        border: 'hover:border-cyanGlow/45',
        badge: 'bg-cyanGlow/15 text-cyanGlow border-cyanGlow/30',
        iconBg: 'bg-cyanGlow/15 text-cyanGlow border-cyanGlow/30',
        glow: 'from-cyanGlow/15 via-transparent to-transparent',
      };
  }
}

// ---------------------------------------------------------------------------
// Lifecycle Disposal — Zero Leaked WebGL Contexts or Event Listeners
// ---------------------------------------------------------------------------

function safeDispose(instance) {
  if (!instance) return;
  try {
    if (typeof instance === 'function') {
      instance();
    } else if (typeof instance.dispose === 'function') {
      instance.dispose();
    } else if (typeof instance.destroy === 'function') {
      instance.destroy();
    }
  } catch (err) {
    console.warn('[EIGENLAB] Disposal warning:', err);
  }
}

function disposeActiveWidgets() {
  safeDispose(activeInstances.ambientHero);
  safeDispose(activeInstances.studio3D);
  safeDispose(activeInstances.stackedLab);
  safeDispose(activeInstances.quizEngine);
  safeDispose(activeInstances.stepSolver);

  activeInstances.ambientHero = null;
  activeInstances.studio3D = null;
  activeInstances.stackedLab = null;
  activeInstances.quizEngine = null;
  activeInstances.stepSolver = null;

  while (activeInstances.cleanupFns.length) {
    const fn = activeInstances.cleanupFns.pop();
    try {
      fn?.();
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Shared Header Controls (Brand Mark, Lens Switch, Audio Toggle)
// ---------------------------------------------------------------------------

function renderBrandLogo() {
  return `
    <div class="flex items-center gap-3 select-none">
      <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyanGlow/20 via-slate-900 to-violetGlow/20 border border-white/15 flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.18)]">
        <svg viewBox="0 0 36 36" class="w-5 h-5" fill="none" aria-hidden="true">
          <path d="M9 10H26M9 18H21M9 26H26M9 10V26" stroke="#22D3EE" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="26.5" cy="18" r="2.75" fill="#F59E0B"/>
        </svg>
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-2">
          <span class="font-display font-bold tracking-[0.12em] text-base text-white">EIGENLAB</span>
          <span class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyanGlow/10 text-cyanGlow border border-cyanGlow/25">Studio</span>
        </div>
        <div class="text-[11px] text-slate-400 hidden sm:block">Interactive 3D Engineering Studio</div>
      </div>
    </div>
  `;
}

function renderLensToggleButton(id = 'btn-lens-toggle') {
  const on = isMechatronicsLens();
  return `
    <button
      id="${id}"
      type="button"
      role="switch"
      aria-checked="${on ? 'true' : 'false'}"
      class="group inline-flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all duration-200 cursor-pointer ${
        on
          ? 'bg-amberGlow/15 border-amberGlow/50 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
          : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
      }"
      title="Toggle Mechatronics Lens: switch between pure calculus f(x) and servo kinematics x(t), v(t)"
    >
      <span class="text-xs sm:text-sm leading-none" aria-hidden="true">⚙️</span>
      <span class="hidden md:inline">Mechatronics Lens:</span>
      <span class="md:hidden">Mech</span>
      <span class="font-mono font-semibold tracking-wider ${on ? 'text-amberGlow' : 'text-slate-400'}">${
        on ? 'ON' : 'OFF'
      }</span>
      <span class="hidden sm:inline-flex relative w-8 h-4 rounded-full transition-colors duration-200 ${
        on ? 'bg-amberGlow/45' : 'bg-slate-700/80'
      }">
        <span class="inline-block w-3 h-3 rounded-full shadow transition-transform duration-200 mt-0.5 ${
          on ? 'bg-amber-300' : 'bg-slate-300'
        }" style="transform: translateX(${on ? '17px' : '2px'})"></span>
      </span>
    </button>
  `;
}

function renderAudioButton(id = 'btn-audio-toggle') {
  const muted = isSoundMuted();
  return `
    <button
      id="${id}"
      type="button"
      aria-label="${muted ? 'Unmute studio audio' : 'Mute studio audio'}"
      aria-pressed="${muted ? 'true' : 'false'}"
      class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all duration-200 cursor-pointer ${
        muted
          ? 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
          : 'bg-white/[0.05] border-white/15 text-slate-200 hover:border-cyanGlow/40 hover:text-cyanGlow'
      }"
      title="${muted ? 'Sound muted (click to enable)' : 'Studio audio active (click to mute)'}"
    >
      <span class="text-sm leading-none">${muted ? '🔇' : '🔊'}</span>
    </button>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 1 — EIGENLAB Discipline Hub (Home Dashboard)
// ---------------------------------------------------------------------------

function renderMasteryRingSVG(percent) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return `
    <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
      <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="eigenMasteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22D3EE" />
            <stop offset="55%" stop-color="#A78BFA" />
            <stop offset="100%" stop-color="#34D399" />
          </linearGradient>
        </defs>
        <circle
          cx="48" cy="48" r="${radius}"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          stroke-width="7"
        />
        <circle
          cx="48" cy="48" r="${radius}"
          fill="none"
          stroke="url(#eigenMasteryGrad)"
          stroke-width="7"
          stroke-linecap="round"
          stroke-dasharray="${circumference.toFixed(2)}"
          stroke-dashoffset="${offset.toFixed(2)}"
          style="transition: stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1);"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span class="font-display font-bold text-xl text-white leading-none">${percent}%</span>
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">Mastery</span>
      </div>
    </div>
  `;
}

function renderDomainCardsHTML() {
  const domains = appState.curriculum?.domains || FALLBACK_CURRICULUM.domains;

  return domains
    .map((domain) => {
      const accent = getAccentClasses(domain.accent || domain.id);
      const lessons = Array.isArray(domain.lessons) ? domain.lessons : [];
      const liveCount = lessons.filter((l) => l.status === 'live').length;
      const symbolText = domain.symbol || domain.icon || '◆';

      const lessonsMarkup = lessons
        .map((lesson) => {
          const isLive = lesson.status === 'live';
          if (isLive) {
            return `
              <div class="group/lesson relative rounded-2xl p-4 bg-gradient-to-br from-cyanGlow/[0.08] via-slate-900/75 to-slate-950/90 border border-cyanGlow/35 hover:border-cyanGlow/65 transition-all duration-200 shadow-[0_0_28px_rgba(34,211,238,0.09)]">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span class="inline-flex items-center gap-2 text-[11px] font-mono tracking-wide text-cyanGlow">
                    ${escapeHtml(lesson.tag || 'Lesson 01 • 3D Interactive + Step Solver')}
                  </span>
                  <span class="status-live">Live</span>
                </div>
                <h4 class="font-display font-semibold text-base text-white mb-1">
                  ${escapeHtml(lesson.title)}
                </h4>
                ${
                  lesson.description
                    ? `<p class="text-xs text-slate-300/90 leading-relaxed mb-3.5">${escapeHtml(lesson.description)}</p>`
                    : ''
                }
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    data-launch-lesson="${escapeHtml(lesson.id)}"
                    class="btn-glow-cyan !rounded-xl !text-xs !py-2 !px-4"
                  >
                    <span>Launch 3D Lab</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  ${
                    lesson.estimatedMinutes
                      ? `<span class="text-[11px] font-mono text-slate-400">~${lesson.estimatedMinutes} min • 4 Stages</span>`
                      : ''
                  }
                </div>
              </div>
            `;
          }

          return `
            <div class="glass-card !rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 !bg-white/[0.025] hover:!bg-white/[0.045]">
              <div class="min-w-0">
                <h4 class="text-sm font-medium text-slate-200 truncate">${escapeHtml(lesson.title)}</h4>
                ${
                  lesson.description
                    ? `<p class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(lesson.description)}</p>`
                    : ''
                }
              </div>
              <span class="status-planned shrink-0">Coming Next</span>
            </div>
          `;
        })
        .join('');

      return `
        <article class="glass-panel relative overflow-hidden p-5 sm:p-6 ${accent.border} transition-all duration-300 flex flex-col">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.glow} opacity-70"></div>
          <div class="relative flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="min-w-[46px] h-11 px-2 rounded-2xl border ${accent.iconBg} flex items-center justify-center font-mono font-bold text-sm shrink-0">
                ${escapeHtml(symbolText)}
              </div>
              <div>
                <h3 class="font-display font-semibold text-lg text-white leading-snug">
                  ${escapeHtml(domain.title)}
                </h3>
                <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  ${escapeHtml(domain.subtitle || '')}
                </p>
              </div>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
              liveCount > 0
                ? 'bg-cyanGlow/10 text-cyanGlow border-cyanGlow/30'
                : 'bg-white/[0.04] text-slate-400 border-white/10'
            }">
              ${liveCount > 0 ? `${liveCount} Live` : 'Roadmap'}
            </span>
          </div>

          <div class="relative space-y-2.5 flex-1">
            ${lessonsMarkup}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderHubView() {
  disposeActiveWidgets();
  appState.view = 'hub';

  const root = document.getElementById('app');
  if (!root) return;

  const stats = getMasterySnapshot();
  const lensOn = isMechatronicsLens();

  root.innerHTML = `
    <div class="min-h-screen flex flex-col relative view-enter">
      <div class="ambient-mesh" aria-hidden="true"></div>

      <!-- Sticky Frosted Top Studio Header -->
      <header class="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/80 backdrop-blur-xl">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-3">
          ${renderBrandLogo()}

          <div class="flex items-center gap-1.5 sm:gap-3">
            <div class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono">
              <span class="text-amberGlow" aria-hidden="true">🔥</span>
              <span class="text-slate-300">Streak:</span>
              <span id="hub-header-streak" class="text-white font-semibold">${stats.streak}</span>
            </div>
            <div id="hub-lens-slot">${renderLensToggleButton('hub-lens-toggle')}</div>
            <div id="hub-audio-slot">${renderAudioButton('hub-audio-toggle')}</div>
          </div>
        </div>
      </header>

      <!-- Main Hub Content -->
      <main class="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-10">
        <!-- Hero Grid -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          <!-- Left Hero Column -->
          <div class="lg:col-span-7 flex flex-col justify-between gap-4 sm:gap-6">
            <div class="space-y-3 sm:space-y-4">
              <div class="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyanGlow/10 border border-cyanGlow/25 text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">
                <span class="w-1.5 h-1.5 rounded-full bg-cyanGlow animate-pulse"></span>
                Interactive 3D Engineering Studio
              </div>

              <h1 class="font-display font-bold text-2xl sm:text-4xl lg:text-[2.85rem] text-white tracking-tight leading-[1.12]">
                Spatial Engineering Mastery for
                <span class="bg-gradient-to-r from-cyanGlow via-sky-300 to-violetGlow bg-clip-text text-transparent">
                  Mechatronics, Physics &amp; AI
                </span>
              </h1>

              <p class="text-xs sm:text-base text-slate-300/90 max-w-2xl leading-relaxed">
                Manipulate live 3D WebGL curves, collapse secant chords into exact tangent vectors, and solve paperless symbolic derivations—with a global <span class="text-amberGlow font-medium">Mechatronics Lens</span> bridging calculus directly to actuators, velocity profiles, and feedback control.
              </p>

              <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
                <button
                  id="hub-hero-launch"
                  type="button"
                  class="btn-glow-cyan w-full sm:w-auto !rounded-2xl !px-5 !py-2.5 sm:!py-3 !text-sm"
                >
                  <span>Launch Lesson 01: Derivatives 3D Lab</span>
                  <span aria-hidden="true" class="text-base">→</span>
                </button>

                <span class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 font-mono">
                  <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow' : 'bg-cyanGlow'}"></span>
                  Lens: <strong class="text-white">${lensOn ? 'Mechatronics x(t), v(t)' : "Pure Math f(x), f'(x)"}</strong>
                </span>
              </div>
            </div>

            <!-- Mastery Progress Ring Card -->
            <div class="glass-panel p-3.5 sm:p-5 flex flex-row items-center gap-3.5 sm:gap-5">
              <div class="shrink-0 scale-90 sm:scale-100 -m-1 sm:m-0">${renderMasteryRingSVG(stats.percent)}</div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                  <div class="min-w-0">
                    <h2 class="font-display font-semibold text-xs sm:text-sm text-white truncate">Lesson 01 Mastery</h2>
                    <p class="hidden sm:block text-xs text-slate-400">Progress saved locally across 3D Lab, Visual Quiz &amp; Step Solver</p>
                  </div>
                  <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono bg-emeraldGlow/10 text-emeraldGlow border border-emeraldGlow/25 shrink-0">
                    ${stats.completedStages.length}/4 Stages
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Solver</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-white mt-0.5">
                      ${stats.solvedProblems}<span class="text-slate-500 text-xs sm:text-sm">/${stats.totalProblems}</span>
                    </div>
                  </div>
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Quiz</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-white mt-0.5">
                      ${stats.solvedVisual}<span class="text-slate-500 text-xs sm:text-sm">/${stats.totalVisual}</span>
                    </div>
                  </div>
                  <div class="rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2.5 bg-white/[0.03] border border-white/[0.07]">
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">Streak</div>
                    <div class="font-display font-bold text-sm sm:text-lg text-amberGlow mt-0.5">
                      ${stats.streak} <span class="hidden sm:inline text-xs font-mono text-slate-400">run</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Hero Column: Interactive 3D Ambient Preview Card -->
          <div class="lg:col-span-5 flex flex-col">
            <div class="canvas-stage relative flex-1 min-h-[190px] sm:min-h-[340px] lg:min-h-[420px] flex flex-col">
              <!-- Live Three.js Ambient Container -->
              <div id="hub-ambient-3d" class="absolute inset-0 w-full h-full"></div>

              <!-- HUD Overlays -->
              <div class="pointer-events-none relative z-10 flex items-center justify-between p-3 sm:p-4">
                <span class="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-mono text-cyanGlow">
                  <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                  Live 3D Tangent Manifold
                </span>
                <span class="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-[#0B0D12]/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                  Three.js 0.170
                </span>
              </div>

              <div class="pointer-events-none relative z-10 mt-auto p-3 sm:p-4 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/45 to-transparent">
                <div class="flex items-end justify-between gap-3">
                  <div>
                    <div class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-amberGlow/90">Interactive Preview</div>
                    <div class="font-display font-semibold text-sm sm:text-base text-white">Secant → Tangent Convergence</div>
                    <div class="hidden sm:block text-xs text-slate-400 mt-0.5">Orbit the curve, scrub Δx → 0, and inspect 3D derivative ribbons.</div>
                  </div>
                  <button
                    id="hub-preview-launch"
                    type="button"
                    class="pointer-events-auto btn-glass !py-1.5 sm:!py-2 !px-3 sm:!px-3.5 !text-xs !font-mono shrink-0"
                  >
                    Open Lab ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4-Domain Dynamic Navigation Grid -->
        <section class="space-y-3 sm:space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
            <div>
              <div class="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-slate-400">Discipline Roadmap</div>
              <h2 class="font-display font-bold text-xl sm:text-2xl text-white mt-0.5">Engineering &amp; Science Tracks</h2>
            </div>
            <p class="hidden sm:block text-xs text-slate-400 max-w-md">
              A unified multi-discipline STEM studio—launch Lesson 01 Derivatives now while future tracks plug seamlessly into the same 3D &amp; symbolic core.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${renderDomainCardsHTML()}
          </div>
        </section>
      </main>
    </div>
  `;

  // Mount Ambient 3D Hero Preview Scene
  const previewEl = document.getElementById('hub-ambient-3d');
  if (previewEl && typeof createAmbientHeroScene === 'function') {
    try {
      activeInstances.ambientHero = createAmbientHeroScene(previewEl);
    } catch (err) {
      console.warn('[EIGENLAB] Ambient 3D preview fallback:', err);
    }
  }

  // Wire Hub Actions
  document.getElementById('hub-hero-launch')?.addEventListener('click', () => {
    playSfx('tick');
    openLesson(LESSON_ID, '3d-lab');
  });

  document.getElementById('hub-preview-launch')?.addEventListener('click', () => {
    playSfx('tick');
    openLesson(LESSON_ID, '3d-lab');
  });

  root.querySelectorAll('[data-launch-lesson]').forEach((btn) => {
    btn.addEventListener('click', () => {
      playSfx('tick');
      const lessonId = btn.getAttribute('data-launch-lesson') || LESSON_ID;
      openLesson(lessonId, '3d-lab');
    });
  });

  document.getElementById('hub-lens-toggle')?.addEventListener('click', () => {
    playSfx('snap');
    store.toggleLens();
    renderHubView();
  });

  bindHubAudioToggle();
}

function bindHubAudioToggle() {
  document.getElementById('hub-audio-toggle')?.addEventListener('click', () => {
    const nextMuted = store.toggleMute();
    if (!nextMuted) playSfx('tick');
    const slot = document.getElementById('hub-audio-slot');
    if (slot) slot.innerHTML = renderAudioButton('hub-audio-toggle');
    bindHubAudioToggle();
  });
}

// ---------------------------------------------------------------------------
// VIEW 2 — Lesson 01: Derivatives Studio (`calc-derivatives`)
// ---------------------------------------------------------------------------

function openLesson(lessonId = LESSON_ID, stageId = '3d-lab') {
  appState.view = 'lesson';
  appState.lessonId = lessonId;
  appState.stage = stageId;
  renderLessonShell();
  mountActiveStage();
}

function renderStageCompletionDotsHTML() {
  return STAGES.map((stage) => {
    const done = isStageDone(stage.id);
    const active = appState.stage === stage.id;
    let classes = 'bg-white/10 border-white/20 text-slate-400 hover:border-white/40';
    if (done) {
      classes =
        'bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_10px_rgba(52,211,153,0.3)]';
    } else if (active) {
      classes =
        'bg-cyanGlow/20 border-cyanGlow text-cyanGlow shadow-[0_0_10px_rgba(34,211,238,0.35)]';
    }
    return `
      <button
        type="button"
        data-stage-jump="${stage.id}"
        title="Stage ${stage.number}: ${escapeHtml(stage.shortLabel)}${done ? ' (Completed)' : ''}"
        class="w-6 h-6 rounded-full border text-[11px] font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${classes}"
      >
        ${done ? '✓' : stage.number}
      </button>
    `;
  }).join('');
}

function updateLessonStageDotsUI() {
  const dotsWrap = document.getElementById('lesson-stage-dots');
  if (dotsWrap) {
    dotsWrap.innerHTML = renderStageCompletionDotsHTML();
    dotsWrap.querySelectorAll('[data-stage-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-stage-jump');
        if (target && target !== appState.stage) {
          playSfx('tick');
          switchStage(target);
        }
      });
    });
  }

  STAGES.forEach((stage) => {
    const done = isStageDone(stage.id);
    document.querySelectorAll(`[data-stage-pill="${stage.id}"]`).forEach((pill) => {
      pill.classList.toggle('is-complete', done);
      const badge = pill.querySelector('[data-stage-check]');
      if (badge) {
        if (pill.classList.contains('mobile-tab')) {
          badge.className = done
            ? 'absolute top-1 right-2 w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_6px_#34D399]'
            : 'hidden';
          badge.textContent = '';
        } else {
          badge.className = done
            ? 'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emeraldGlow/20 text-emeraldGlow text-[10px]'
            : 'hidden';
          badge.textContent = done ? '✓' : '';
        }
      }
    });
  });
}

function renderLessonShell() {
  disposeActiveWidgets();
  const root = document.getElementById('app');
  if (!root) return;

  const mobileLabels = {
    '3d-lab': '3D Lab',
    intuition: 'Graphs',
    solver: 'Solver',
    'word-problems': 'Applied',
  };

  root.innerHTML = `
    <div class="min-h-screen flex flex-col relative view-enter">
      <div class="ambient-mesh" aria-hidden="true"></div>

      <!-- Sticky Frosted Top Bar (Compact h-12 on Mobile, h-16 on Desktop) -->
      <header class="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/88 backdrop-blur-xl">
        <div class="max-w-[1440px] mx-auto px-2.5 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <!-- Back + Lesson Title + Completion Dots -->
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              id="btn-back-hub"
              type="button"
              class="btn-glass !py-1 md:!py-1.5 !px-2.5 md:!px-3 !text-xs shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span class="hidden sm:inline">All Disciplines</span>
              <span class="sm:hidden">Hub</span>
            </button>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono uppercase tracking-wider text-cyanGlow hidden md:inline">Lesson 01</span>
                <h1 class="font-display font-bold text-xs sm:text-base text-white truncate">
                  Derivatives Studio
                </h1>
              </div>
              <div id="lesson-lens-subtitle" class="text-[11px] text-slate-400 truncate hidden md:block">
                ${
                  isMechatronicsLens()
                    ? 'Mechatronics Lens: Displacement x(t) → Velocity v(t) & Actuator Dynamics'
                    : 'Calculus Lens: Secant Limits, Tangent Slopes & Symbolic Rules'
                }
              </div>
            </div>

            <div id="lesson-stage-dots" class="hidden lg:flex items-center gap-1.5 pl-3 border-l border-white/10">
              ${renderStageCompletionDotsHTML()}
            </div>
          </div>

          <!-- Global Lens & Audio Controls -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div id="lesson-lens-toggle-slot">${renderLensToggleButton('lesson-lens-toggle')}</div>
            <div id="lesson-audio-toggle-slot">${renderAudioButton('lesson-audio-toggle')}</div>
          </div>
        </div>
      </header>

      <!-- Desktop/Tablet Floating Pill Navigation Bar (Hidden on Mobile in favor of Thumb Bottom Bar) -->
      <nav aria-label="Lesson stages" class="hidden md:block sticky top-16 z-30 py-3 px-3 sm:px-6 bg-gradient-to-b from-[#0B0D12]/90 via-[#0B0D12]/65 to-transparent backdrop-blur-md">
        <div class="max-w-[1440px] mx-auto flex justify-center">
          <div class="stage-nav studio-scroll">
            ${STAGES.map((stage) => {
              const active = appState.stage === stage.id;
              const done = isStageDone(stage.id);
              return `
                <button
                  type="button"
                  data-stage-pill="${stage.id}"
                  aria-current="${active ? 'page' : 'false'}"
                  class="stage-pill ${active ? 'active' : ''} ${done ? 'is-complete' : ''}"
                >
                  <span aria-hidden="true">${stage.icon}</span>
                  <span>${escapeHtml(stage.label)}</span>
                  <span data-stage-check class="${
                    done
                      ? 'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emeraldGlow/20 text-emeraldGlow text-[10px]'
                      : 'hidden'
                  }">${done ? '✓' : ''}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </nav>

      <!-- Active Stage Mount Point -->
      <main id="stage-container" class="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-2.5 sm:px-6 pt-2 md:pt-0 pb-24 md:pb-10"></main>

      <!-- Mobile Thumb-Friendly Floating Bottom Tab Bar (md:hidden) -->
      <nav aria-label="Mobile lesson stages" class="mobile-bottom-nav md:hidden">
        <div class="grid grid-cols-4 gap-1 max-w-md mx-auto">
          ${STAGES.map((stage) => {
            const active = appState.stage === stage.id;
            const done = isStageDone(stage.id);
            return `
              <button
                type="button"
                data-stage-pill="${stage.id}"
                aria-current="${active ? 'page' : 'false'}"
                class="mobile-tab ${active ? 'active' : ''} ${done ? 'is-complete' : ''}"
              >
                <span aria-hidden="true" class="text-base leading-none">${stage.icon}</span>
                <span>${escapeHtml(mobileLabels[stage.id] || stage.shortLabel)}</span>
                <span data-stage-check class="${
                  done
                    ? 'absolute top-1 right-2 w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_6px_#34D399]'
                    : 'hidden'
                }"></span>
              </button>
            `;
          }).join('')}
        </div>
      </nav>
    </div>
  `;

  // Wire Top Bar & Pill Nav
  document.getElementById('btn-back-hub')?.addEventListener('click', () => {
    playSfx('tick');
    renderHubView();
  });

  bindLessonLensToggle();
  bindLessonAudioToggle();
  updateLessonStageDotsUI();

  root.querySelectorAll('[data-stage-pill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextStage = btn.getAttribute('data-stage-pill');
      if (nextStage && nextStage !== appState.stage) {
        playSfx('tick');
        switchStage(nextStage);
      }
    });
  });
}

function bindLessonLensToggle() {
  document.getElementById('lesson-lens-toggle')?.addEventListener('click', () => {
    playSfx('snap');
    store.toggleLens();
    propagateLensToActiveStage();
  });
}

function bindLessonAudioToggle() {
  document.getElementById('lesson-audio-toggle')?.addEventListener('click', () => {
    const nextMuted = store.toggleMute();
    if (!nextMuted) playSfx('tick');
    const slot = document.getElementById('lesson-audio-toggle-slot');
    if (slot) slot.innerHTML = renderAudioButton('lesson-audio-toggle');
    bindLessonAudioToggle();
  });
}

function propagateLensToActiveStage() {
  const on = isMechatronicsLens();
  const lensStr = on ? 'mechatronics' : 'math';

  // Update top bar button & subtitle
  const lensSlot = document.getElementById('lesson-lens-toggle-slot');
  if (lensSlot) {
    lensSlot.innerHTML = renderLensToggleButton('lesson-lens-toggle');
    bindLessonLensToggle();
  }

  const sub = document.getElementById('lesson-lens-subtitle');
  if (sub) {
    sub.textContent = on
      ? 'Mechatronics Lens: Displacement x(t) → Velocity v(t) & Actuator Dynamics'
      : 'Calculus Lens: Secant Limits, Tangent Slopes & Symbolic Rules';
  }

  // Propagate immediately to active stage components
  if (activeInstances.studio3D) {
    activeInstances.studio3D.toggleMechatronicsLens?.(on);
    updateStage1LensUI();
    updateStage1TelemetryUI();
  }
  if (activeInstances.stackedLab) {
    activeInstances.stackedLab.setMechatronicsLens?.(on);
    activeInstances.stackedLab.setLens?.(lensStr);
    const titleEl = document.getElementById('stage2-lab-title');
    if (titleEl) {
      titleEl.textContent = on
        ? 'Synchronized Position x(t) & Velocity v(t)'
        : "Synchronized f(x) & Derivative f'(x)";
    }
  }
  if (activeInstances.quizEngine) {
    activeInstances.quizEngine.setMechatronicsLens?.(on);
    activeInstances.quizEngine.setLens?.(lensStr);
  }
  if (activeInstances.stepSolver) {
    activeInstances.stepSolver.setMechatronicsLens?.(on);
    activeInstances.stepSolver.setLens?.(lensStr);
  }
  if (appState.stage === 'word-problems') {
    mountStage4WordProblems(document.getElementById('stage-container'));
  }
}

function switchStage(stageId) {
  disposeActiveWidgets();
  appState.stage = stageId;

  document.querySelectorAll('[data-stage-pill]').forEach((btn) => {
    const id = btn.getAttribute('data-stage-pill');
    const active = id === stageId;
    btn.setAttribute('aria-current', active ? 'page' : 'false');
    btn.classList.toggle('active', active);
  });

  updateLessonStageDotsUI();
  mountActiveStage();
}

function mountActiveStage() {
  const container = document.getElementById('stage-container');
  if (!container) return;

  switch (appState.stage) {
    case '3d-lab':
      mountStage1Lab3D(container);
      break;
    case 'intuition':
      mountStage2Intuition(container);
      break;
    case 'solver':
      mountStage3Solver(container);
      break;
    case 'word-problems':
      mountStage4WordProblems(container);
      break;
    default:
      mountStage1Lab3D(container);
  }
}

// ---------------------------------------------------------------------------
// STAGE 1 — Full-Bleed Spline-Style 3D Limit & Tangent Lab (`3d-lab`)
// ---------------------------------------------------------------------------

function computeLocalTelemetry(preset, x0, dx) {
  const safeDx = Math.abs(dx) < 1e-6 ? 1e-6 : dx;
  let fx0 = 0;
  let fx1 = 0;
  let exactSlope = 0;
  let secantSlope = 0;

  try {
    fx0 = Number(preset.f(x0));
    fx1 = Number(preset.f(x0 + safeDx));
    secantSlope = (fx1 - fx0) / safeDx;
    exactSlope =
      typeof preset.df === 'function'
        ? Number(preset.df(x0))
        : (preset.f(x0 + 1e-5) - preset.f(x0 - 1e-5)) / 2e-5;
  } catch {
    // Fallback zeros
  }

  return {
    x0,
    dx: safeDx,
    fx0,
    fx1,
    secantSlope,
    exactSlope,
    tangentLocked: Math.abs(safeDx) <= 0.025,
  };
}

function mountStage1Lab3D(container) {
  const presets = normalizePresets();
  const activePreset = getActivePreset(presets);
  const lensOn = isMechatronicsLens();

  if (activePreset) {
    appState.lab.x0 = Math.max(
      activePreset.xMin + 0.2,
      Math.min(activePreset.xMax - 0.2, appState.lab.x0 ?? activePreset.defaultX)
    );
    appState.telemetry = computeLocalTelemetry(
      activePreset,
      appState.lab.x0,
      appState.lab.dx
    );
  }

  container.innerHTML = `
    <section class="space-y-2 sm:space-y-4 view-enter">
      <!-- Top Preset Strip + Camera Angle Presets -->
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar xl:flex-wrap flex-1 min-w-0 py-0.5" role="tablist" aria-label="Function presets">
          ${presets
            .map((p) => {
              const isSelected = activePreset && p.id === activePreset.id;
              return `
                <button
                  type="button"
                  data-preset-id="${escapeHtml(p.id)}"
                  class="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }"
                >
                  ${escapeHtml(p.name)}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="hidden xl:flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/10 shrink-0">
          ${[
            { id: '3d', label: '3D Studio' },
            { id: 'front', label: 'Front 2D Graph' },
            { id: 'iso', label: 'Isometric' },
          ]
            .map((cam) => {
              const active = appState.lab.cameraPreset === cam.id;
              return `
                <button
                  type="button"
                  data-camera-preset="${cam.id}"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 border border-transparent hover:text-white'
                  }"
                >
                  ${cam.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Main Full-Bleed Spline-Style 3D Studio Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-4 items-stretch">
        <!-- 3D Viewport Canvas Container (Compact Split-Screen on Mobile, Full-Bleed on Desktop) -->
        <div class="xl:col-span-8 canvas-stage relative h-[37dvh] min-h-[215px] max-h-[300px] sm:h-[420px] sm:max-h-none xl:h-[calc(100vh-210px)] xl:min-h-[540px] flex flex-col">
          <!-- Three.js Mount -->
          <div id="derivative-3d-canvas" class="absolute inset-0 w-full h-full"></div>

          <!-- Top-Left Floating Equation HUD -->
          <div class="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div class="pointer-events-auto rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 bg-[#0B0D12]/80 backdrop-blur-xl border border-white/15 shadow-lg max-w-full">
              <div class="hidden sm:flex items-center gap-2 mb-1.5">
                <span class="w-2 h-2 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                <span id="hud-curve-label" class="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ${lensOn ? 'Actuator Displacement & Velocity' : 'Active Curve & Exact Derivative'}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-xs sm:text-sm text-white">
                <span id="hud-fx-math" class="text-cyan-200"></span>
                <span class="hidden sm:inline text-slate-600">|</span>
                <span id="hud-dfx-math" class="hidden sm:inline text-violet-300"></span>
              </div>
            </div>

            <!-- Synced Mechatronics 3D Actuator Indicator (Desktop/Tablet) -->
            <div id="hud-mech-indicator" class="hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
              lensOn
                ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
            }">
              <div class="flex items-center gap-2 text-[11px] font-mono">
                <span class="w-2 h-2 rounded-full ${lensOn ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}"></span>
                <span id="hud-mech-text">${lensOn ? '3D Servo Actuator: SYNCED' : '3D Actuator: Standby'}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Floating Canvas Legend + Compact Mobile Camera Switcher -->
          <div class="pointer-events-none relative z-10 mt-auto p-2 sm:p-4 flex items-center justify-between gap-2">
            <div class="hidden sm:inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
              <span><span class="text-cyanGlow">●</span> Curve</span>
              <span><span class="text-amberGlow">●</span> Secant Δx</span>
              <span><span class="text-emeraldGlow">●</span> Tangent</span>
              <span><span class="text-violetGlow">●</span> f&apos;(x) Ribbon</span>
            </div>

            <!-- Compact 1-tap Camera Presets inside Viewport on Mobile/Tablet -->
            <div class="pointer-events-auto xl:hidden ml-auto flex items-center gap-0.5 bg-[#0B0D12]/80 backdrop-blur-md p-0.5 rounded-xl border border-white/15">
              ${[
                { id: '3d', label: '3D' },
                { id: 'front', label: '2D' },
                { id: 'iso', label: 'Iso' },
              ]
                .map((cam) => {
                  const active = appState.lab.cameraPreset === cam.id;
                  return `
                    <button
                      type="button"
                      data-camera-preset="${cam.id}"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        active
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }"
                    >
                      ${cam.label}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="hidden xl:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-400">
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Tactile Control Deck & Live KaTeX Telemetry Card -->
        <aside class="xl:col-span-4 flex flex-col gap-2.5 sm:gap-4 xl:h-[calc(100vh-210px)] xl:overflow-y-auto studio-scroll pr-0.5">
          <!-- Live Telemetry Card (Ultra-Compact 1-Row Strip on Mobile with Tap-to-Expand KaTeX; Always Expanded on xl) -->
          <div class="glass-panel p-2.5 sm:p-5 space-y-2 sm:space-y-4">
            <!-- Header + Mobile Compact Slope Strip -->
            <div class="flex items-center justify-between gap-2">
              <div class="hidden xl:block">
                <div class="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Live Limit Telemetry</div>
                <h2 class="font-display font-semibold text-sm text-white mt-0.5">Difference Quotient</h2>
              </div>

              <!-- Compact Inline Secant vs Exact Readout (always visible on mobile/tablet!) -->
              <div class="flex xl:hidden items-center gap-2 min-w-0 flex-1">
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1.5 bg-amberGlow/[0.08] border border-amberGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-amberGlow/90 truncate">
                    ${lensOn ? 'Avg Δx/Δt' : 'Secant'}
                  </div>
                  <div id="val-secant-slope-compact" class="font-mono font-semibold text-sm text-white leading-tight">
                    ${formatNum(appState.telemetry.secantSlope, 3)}
                  </div>
                </div>
                <div class="flex-1 min-w-0 rounded-xl px-2.5 py-1.5 bg-emeraldGlow/[0.08] border border-emeraldGlow/25">
                  <div class="text-[9px] font-mono uppercase tracking-wider text-emeraldGlow/90 truncate">
                    ${lensOn ? 'v(t₀)' : "Exact f'"}
                  </div>
                  <div id="val-exact-slope-compact" class="font-mono font-semibold text-sm text-emeraldGlow leading-tight">
                    ${formatNum(appState.telemetry.exactSlope, 3)}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div
                  id="badge-tangent-locked"
                  class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 ${
                    appState.telemetry.tangentLocked
                      ? 'bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_18px_rgba(52,211,153,0.3)]'
                      : 'bg-amberGlow/15 border-amberGlow/30 text-amberGlow'
                  }"
                >
                  ${appState.telemetry.tangentLocked ? 'TANGENT ✓' : 'SECANT'}
                </div>
                <button
                  id="btn-toggle-mobile-formula"
                  type="button"
                  aria-expanded="false"
                  title="Toggle KaTeX difference quotient formula"
                  class="xl:hidden px-2 py-1 rounded-lg bg-white/[0.05] border border-white/15 text-[11px] font-mono text-cyan-200 cursor-pointer"
                >
                  ƒ ▾
                </button>
              </div>
            </div>

            <!-- Collapsible on Mobile (<xl), Always Open on Desktop (xl:block): Full KaTeX Formula & Error Metrics -->
            <div id="mobile-formula-drawer" class="hidden xl:block space-y-3 sm:space-y-4">
              <!-- KaTeX Difference Quotient Formula -->
              <div class="katex-card flex items-center justify-center min-h-[60px] sm:min-h-[76px]">
                <div id="telemetry-quotient-katex" class="text-slate-100 text-xs sm:text-sm overflow-x-auto"></div>
              </div>

              <!-- Secant vs Exact Slope Comparison Grid (Desktop xl) -->
              <div class="hidden xl:grid grid-cols-2 gap-3">
                <div class="rounded-2xl p-3.5 bg-amberGlow/[0.06] border border-amberGlow/25">
                  <div id="label-secant-metric" class="text-[10px] font-mono uppercase tracking-wider text-amberGlow/90">
                    ${lensOn ? 'Avg Velocity Δx/Δt' : 'Secant Slope Δy/Δx'}
                  </div>
                  <div id="val-secant-slope" class="font-mono font-semibold text-xl text-white mt-1">
                    ${formatNum(appState.telemetry.secantSlope, 4)}
                  </div>
                </div>

                <div class="rounded-2xl p-3.5 bg-emeraldGlow/[0.06] border border-emeraldGlow/25">
                  <div id="label-exact-metric" class="text-[10px] font-mono uppercase tracking-wider text-emeraldGlow/90">
                    ${lensOn ? 'Instant v(t₀)' : "Exact f'(x₀)"}
                  </div>
                  <div id="val-exact-slope" class="font-mono font-semibold text-xl text-emeraldGlow mt-1">
                    ${formatNum(appState.telemetry.exactSlope, 4)}
                  </div>
                </div>
              </div>

              <!-- Residual Error Readout -->
              <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Approximation Error |m_sec − f&apos;|</span>
                <span id="val-slope-error" class="text-slate-200">${formatNum(
                  Math.abs(appState.telemetry.secantSlope - appState.telemetry.exactSlope),
                  5
                )}</span>
              </div>
            </div>
          </div>

          <!-- Tactile Sliders & Limit Controls (Always Immediately Visible Below Canvas on Mobile!) -->
          <div class="glass-panel p-3 sm:p-5 space-y-3 sm:space-y-5 flex-1 flex flex-col justify-between">
            <div class="space-y-2.5 sm:space-y-5">
              <!-- Probe Position x0 Slider (Cyan) -->
              <div class="space-y-1 sm:space-y-2">
                <div class="flex items-center justify-between">
                  <label for="slider-x0" id="label-x0-slider" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>
                    ${lensOn ? 'Time Probe t₀ (s)' : 'Probe Position x₀'}
                  </label>
                  <span id="readout-x0" class="px-2 py-0.5 rounded-lg bg-cyanGlow/15 border border-cyanGlow/30 font-mono text-[11px] sm:text-xs text-cyanGlow font-semibold">
                    ${formatSigned(appState.lab.x0, 2)}
                  </span>
                </div>
                <input
                  id="slider-x0"
                  type="range"
                  min="${activePreset ? activePreset.xMin : -3}"
                  max="${activePreset ? activePreset.xMax : 3}"
                  step="0.02"
                  value="${appState.lab.x0}"
                  class="studio-slider-cyan"
                />
              </div>

              <!-- Step Size Δx Slider (Amber) -->
              <div class="space-y-1 sm:space-y-2">
                <div class="flex items-center justify-between">
                  <label for="slider-dx" id="label-dx-slider" class="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>
                    ${lensOn ? 'Time Window Δt (s)' : 'Step Size Δx'}
                  </label>
                  <span id="readout-dx" class="px-2 py-0.5 rounded-lg bg-amberGlow/15 border border-amberGlow/30 font-mono text-[11px] sm:text-xs text-amberGlow font-semibold">
                    ${formatNum(appState.lab.dx, 3)}
                  </span>
                </div>
                <input
                  id="slider-dx"
                  type="range"
                  min="0.001"
                  max="2.2"
                  step="0.001"
                  value="${appState.lab.dx}"
                  class="studio-slider-amber"
                />
                <div class="hidden sm:flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.001 (Tangent Limit)</span>
                  <span>2.200 (Wide Secant)</span>
                </div>
              </div>

              <!-- Action Row: Prominent Animate Limit Button + Compact Mobile Ribbon Toggle -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  id="btn-animate-limit"
                  type="button"
                  class="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amberGlow via-amber-400 to-cyanGlow text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_24px_rgba(245,158,11,0.28)] hover:shadow-[0_0_38px_rgba(34,211,238,0.42)] hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span id="animate-btn-icon" aria-hidden="true">▶</span>
                  <span id="animate-btn-text">${
                    lensOn ? 'Animate Δt → 0' : 'Animate Δx → 0'
                  }</span>
                </button>

                <label class="xl:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-violetGlow/10 border border-violetGlow/30 text-[11px] font-mono text-violet-200 cursor-pointer select-none">
                  <input
                    id="toggle-deriv-ribbon-mobile"
                    type="checkbox"
                    ${appState.lab.showDerivativeCurve ? 'checked' : ''}
                    class="w-3.5 h-3.5 rounded accent-violet-400 cursor-pointer"
                  />
                  <span>${lensOn ? 'v(t)' : "f'(x)"}</span>
                </label>
              </div>
            </div>

            <!-- Toggle Switches & Stage Forward Link (Desktop xl) -->
            <div class="hidden xl:block pt-4 border-t border-white/10 space-y-3">
              <label class="flex items-center justify-between gap-3 cursor-pointer select-none group">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-violetGlow shadow-[0_0_8px_#A78BFA]"></span>
                  <div>
                    <div id="label-ribbon-toggle" class="text-xs font-medium text-slate-200 group-hover:text-white">
                      ${lensOn ? 'Show v(t) 3D Velocity Ribbon' : "Show f'(x) 3D Ribbon"}
                    </div>
                    <div class="text-[11px] text-slate-400">Parallel 3D slope projection track</div>
                  </div>
                </div>
                <input
                  id="toggle-deriv-ribbon"
                  type="checkbox"
                  ${appState.lab.showDerivativeCurve ? 'checked' : ''}
                  class="w-4 h-4 rounded accent-violet-400 cursor-pointer"
                />
              </label>

              <button
                id="btn-next-intuition"
                type="button"
                class="btn-glass w-full !justify-between !text-xs"
              >
                <span>Continue to Stage 2: Curve Intuition</span>
                <span class="text-cyanGlow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  const sliderX0 = document.getElementById('slider-x0');
  const sliderDx = document.getElementById('slider-dx');
  syncSliderTrackFill(sliderX0);
  syncSliderTrackFill(sliderDx);

  // Mount Derivative3DStudio
  const canvasHost = document.getElementById('derivative-3d-canvas');
  let prevLocked = appState.telemetry.tangentLocked;

  const handleTelemetryUpdate = (t = {}) => {
    const currentPreset = getActivePreset(presets);
    const x0 =
      typeof t.x0 === 'number'
        ? t.x0
        : typeof t.x === 'number'
        ? t.x
        : appState.lab.x0;
    const dx =
      typeof t.dx === 'number'
        ? t.dx
        : typeof t.deltaX === 'number'
        ? t.deltaX
        : appState.lab.dx;

    appState.lab.x0 = x0;
    appState.lab.dx = dx;

    const computed = currentPreset
      ? computeLocalTelemetry(currentPreset, x0, dx)
      : appState.telemetry;

    appState.telemetry = {
      x0,
      dx,
      fx0: typeof t.fx0 === 'number' ? t.fx0 : computed.fx0,
      fx1: typeof t.fx1 === 'number' ? t.fx1 : computed.fx1,
      secantSlope:
        typeof t.secantSlope === 'number' ? t.secantSlope : computed.secantSlope,
      exactSlope:
        typeof t.exactSlope === 'number'
          ? t.exactSlope
          : typeof t.derivative === 'number'
          ? t.derivative
          : computed.exactSlope,
      tangentLocked: Math.abs(dx) <= 0.025,
    };

    if (sliderDx && document.activeElement !== sliderDx) {
      sliderDx.value = String(Math.max(0.001, Math.min(2.2, Math.abs(dx))));
      syncSliderTrackFill(sliderDx);
    }
    if (sliderX0 && document.activeElement !== sliderX0) {
      sliderX0.value = String(x0);
      syncSliderTrackFill(sliderX0);
    }

    if (appState.telemetry.tangentLocked && !prevLocked) {
      playSfx('snap');
    }
    prevLocked = appState.telemetry.tangentLocked;

    if (Math.abs(dx) <= 0.03) {
      markStageDone('3d-lab');
    }

    updateStage1TelemetryUI();
  };

  if (canvasHost && typeof Derivative3DStudio === 'function') {
    try {
      const studio = new Derivative3DStudio({
        fnKey: activePreset?.id || 'cubic',
        x: appState.lab.x0,
        dx: appState.lab.dx,
        showDerivative: appState.lab.showDerivativeCurve,
        showMechatronics: isMechatronicsLens(),
        onChange: handleTelemetryUpdate,
      });
      studio.init(canvasHost);
      studio.setCameraPreset(appState.lab.cameraPreset);
      studio.toggleDerivativeCurve(appState.lab.showDerivativeCurve);
      studio.toggleMechatronicsLens(isMechatronicsLens());
      activeInstances.studio3D = studio;
      handleTelemetryUpdate(studio.getMetrics());
    } catch (err) {
      console.error('[EIGENLAB] Derivative3DStudio mount error:', err);
      canvasHost.innerHTML = `
        <div class="w-full h-full flex items-center justify-center p-6 text-center text-slate-400 text-sm">
          WebGL 3D Viewport initializing… (${escapeHtml(err.message)})
        </div>
      `;
    }
  }

  updateStage1LensUI();
  updateStage1TelemetryUI();

  let cancelActiveLimitAnim = null;
  const finishAnimUI = () => {
    appState.lab.isAnimating = false;
    const on = isMechatronicsLens();
    const btnIcon = document.getElementById('animate-btn-icon');
    const btnText = document.getElementById('animate-btn-text');
    if (btnIcon) btnIcon.textContent = '▶';
    if (btnText) btnText.textContent = on ? 'Animate Limit Δt → 0' : 'Animate Limit Δx → 0';
  };
  const stopLimitAnim = () => {
    if (typeof cancelActiveLimitAnim === 'function') {
      cancelActiveLimitAnim();
      cancelActiveLimitAnim = null;
    }
    finishAnimUI();
  };
  activeInstances.cleanupFns.push(() => {
    if (typeof cancelActiveLimitAnim === 'function') {
      cancelActiveLimitAnim();
      cancelActiveLimitAnim = null;
    }
    appState.lab.isAnimating = false;
  });

  // Wire Function Preset Selector
  container.querySelectorAll('[data-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preset-id');
      if (!id) return;
      playSfx('tick');
      stopLimitAnim();
      appState.lab.presetId = id;
      const preset = getActivePreset(presets);

      container.querySelectorAll('[data-preset-id]').forEach((el) => {
        const active = el.getAttribute('data-preset-id') === id;
        el.className = `px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
          active
            ? 'bg-cyanGlow/15 border-cyanGlow/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
        }`;
      });

      if (preset) {
        if (sliderX0) {
          sliderX0.min = String(preset.xMin);
          sliderX0.max = String(preset.xMax);
          appState.lab.x0 = preset.defaultX;
          sliderX0.value = String(preset.defaultX);
          syncSliderTrackFill(sliderX0);
        }
        const metrics = activeInstances.studio3D?.setFunction?.(id);
        handleTelemetryUpdate(metrics || { x: appState.lab.x0, dx: appState.lab.dx });
        updateStage1LensUI();
      }
    });
  });

  // Wire Camera Angle Presets
  container.querySelectorAll('[data-camera-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const camId = btn.getAttribute('data-camera-preset');
      if (!camId) return;
      playSfx('tick');
      appState.lab.cameraPreset = camId;
      container.querySelectorAll('[data-camera-preset]').forEach((el) => {
        const active = el.getAttribute('data-camera-preset') === camId;
        el.className = `px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
          active
            ? 'bg-white/15 text-white border border-white/20 shadow-sm'
            : 'text-slate-400 border border-transparent hover:text-white'
        }`;
      });
      activeInstances.studio3D?.setCameraPreset?.(camId);
    });
  });

  // Wire x0 Slider
  sliderX0?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    syncSliderTrackFill(sliderX0);
    appState.lab.x0 = val;
    playSfx('tick');
    const metrics = activeInstances.studio3D?.setX?.(val);
    if (!metrics) handleTelemetryUpdate({ x: val, dx: appState.lab.dx });
  });

  // Wire Δx Slider
  sliderDx?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (appState.lab.isAnimating) stopLimitAnim();
    syncSliderTrackFill(sliderDx);
    appState.lab.dx = val;
    playSfx('tick');
    const metrics = activeInstances.studio3D?.setDeltaX?.(val);
    if (!metrics) handleTelemetryUpdate({ x: appState.lab.x0, dx: val });
  });

  // Wire Derivative 3D Ribbon Toggle (Desktop + Mobile synced)
  const ribbonToggle = document.getElementById('toggle-deriv-ribbon');
  const ribbonToggleMobile = document.getElementById('toggle-deriv-ribbon-mobile');
  const syncRibbon = (checked) => {
    playSfx('snap');
    appState.lab.showDerivativeCurve = !!checked;
    if (ribbonToggle) ribbonToggle.checked = appState.lab.showDerivativeCurve;
    if (ribbonToggleMobile) ribbonToggleMobile.checked = appState.lab.showDerivativeCurve;
    activeInstances.studio3D?.toggleDerivativeCurve?.(appState.lab.showDerivativeCurve);
  };
  ribbonToggle?.addEventListener('change', (e) => syncRibbon(e.target.checked));
  ribbonToggleMobile?.addEventListener('change', (e) => syncRibbon(e.target.checked));

  // Wire Mobile KaTeX Difference Quotient Drawer Toggle
  const formulaBtn = document.getElementById('btn-toggle-mobile-formula');
  const formulaDrawer = document.getElementById('mobile-formula-drawer');
  formulaBtn?.addEventListener('click', () => {
    playSfx('tick');
    if (!formulaDrawer) return;
    const isHidden = formulaDrawer.classList.contains('hidden');
    formulaDrawer.classList.toggle('hidden', !isHidden);
    formulaBtn.setAttribute('aria-expanded', String(isHidden));
    formulaBtn.textContent = isHidden ? 'ƒ ▴' : 'ƒ ▾';
  });

  // Wire Animate Limit Δx → 0 Button (synced live with studio.animateLimit(onFrame))
  const animateBtn = document.getElementById('btn-animate-limit');
  animateBtn?.addEventListener('click', () => {
    playSfx('snap');
    markStageDone('3d-lab');
    stopLimitAnim();

    const studio = activeInstances.studio3D;
    if (!studio || typeof studio.animateLimit !== 'function') return;

    appState.lab.isAnimating = true;
    const btnText = document.getElementById('animate-btn-text');
    const btnIcon = document.getElementById('animate-btn-icon');
    if (btnIcon) btnIcon.textContent = '◉';
    if (btnText) {
      btnText.textContent = isMechatronicsLens()
        ? 'Converging Δt → 0...'
        : 'Converging Δx → 0...';
    }

    cancelActiveLimitAnim = studio.animateLimit((metrics) => {
      if (metrics && Math.abs(metrics.dx) <= 0.0012) {
        cancelActiveLimitAnim = null;
        finishAnimUI();
      }
    });
  });

  document.getElementById('btn-next-intuition')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('intuition');
  });
}

function updateStage1LensUI() {
  const presets = normalizePresets();
  const preset = getActivePreset(presets);
  const on = isMechatronicsLens();

  const fxEl = document.getElementById('hud-fx-math');
  const dfxEl = document.getElementById('hud-dfx-math');
  if (preset) {
    const fTex = on ? preset.mechLatex || toMechatronicsFormula(preset.latex, false) : preset.latex;
    const dfTex = on
      ? preset.mechDerivLatex || toMechatronicsFormula(preset.derivLatex, true)
      : preset.derivLatex;
    typesetMath(fxEl, fTex, false);
    typesetMath(dfxEl, dfTex, false);
  }

  const curveLabel = document.getElementById('hud-curve-label');
  if (curveLabel) {
    curveLabel.textContent = on
      ? preset?.mechatronicsLabel || 'Actuator Displacement & Velocity'
      : 'Active Curve & Exact Derivative';
  }

  const mechInd = document.getElementById('hud-mech-indicator');
  const mechText = document.getElementById('hud-mech-text');
  if (mechInd && mechText) {
    mechInd.className = `hidden sm:block pointer-events-auto rounded-2xl px-3.5 py-2 backdrop-blur-xl border transition-all ${
      on
        ? 'bg-amberGlow/15 border-amberGlow/45 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
        : 'bg-[#0B0D12]/70 border-white/10 text-slate-400'
    }`;
    const dot = mechInd.querySelector('span');
    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${on ? 'bg-amberGlow animate-pulse' : 'bg-slate-600'}`;
    }
    mechText.textContent = on ? '3D Servo Actuator: SYNCED' : '3D Actuator: Standby';
  }

  const x0Label = document.getElementById('label-x0-slider');
  if (x0Label) {
    x0Label.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyanGlow shadow-[0_0_8px_#22D3EE]"></span>${
      on ? 'Time Probe t₀ (s)' : 'Probe Position x₀'
    }`;
  }
  const dxLabel = document.getElementById('label-dx-slider');
  if (dxLabel) {
    dxLabel.innerHTML = `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amberGlow shadow-[0_0_8px_#F59E0B]"></span>${
      on ? 'Time Window Δt (s)' : 'Step Size Δx'
    }`;
  }

  const ribbonLabel = document.getElementById('label-ribbon-toggle');
  if (ribbonLabel) {
    ribbonLabel.textContent = on ? 'Show v(t) 3D Velocity Ribbon' : "Show f'(x) 3D Ribbon";
  }

  const secMetric = document.getElementById('label-secant-metric');
  if (secMetric) secMetric.textContent = on ? 'Avg Velocity Δx/Δt' : 'Secant Slope Δy/Δx';

  const exactMetric = document.getElementById('label-exact-metric');
  if (exactMetric) exactMetric.textContent = on ? 'Instant v(t₀)' : "Exact f'(x₀)";

  if (!appState.lab.isAnimating) {
    const btnText = document.getElementById('animate-btn-text');
    if (btnText) btnText.textContent = on ? 'Animate Δt → 0' : 'Animate Δx → 0';
  }
}

function updateStage1TelemetryUI() {
  const t = appState.telemetry;
  const on = isMechatronicsLens();

  const rX0 = document.getElementById('readout-x0');
  if (rX0) rX0.textContent = formatSigned(t.x0, 2);

  const rDx = document.getElementById('readout-dx');
  if (rDx) rDx.textContent = formatNum(t.dx, 3);

  const secVal = document.getElementById('val-secant-slope');
  if (secVal) secVal.textContent = formatNum(t.secantSlope, 4);

  const exactVal = document.getElementById('val-exact-slope');
  if (exactVal) exactVal.textContent = formatNum(t.exactSlope, 4);

  const secCompact = document.getElementById('val-secant-slope-compact');
  if (secCompact) secCompact.textContent = formatNum(t.secantSlope, 3);

  const exactCompact = document.getElementById('val-exact-slope-compact');
  if (exactCompact) exactCompact.textContent = formatNum(t.exactSlope, 3);

  const errVal = document.getElementById('val-slope-error');
  if (errVal) errVal.textContent = formatNum(Math.abs(t.secantSlope - t.exactSlope), 5);

  const badge = document.getElementById('badge-tangent-locked');
  if (badge) {
    if (t.tangentLocked) {
      badge.textContent = 'TANGENT ✓';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-emeraldGlow/20 border-emeraldGlow/60 text-emeraldGlow shadow-[0_0_18px_rgba(52,211,153,0.3)]';
    } else {
      badge.textContent = 'SECANT';
      badge.className =
        'px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border transition-all duration-300 bg-amberGlow/15 border-amberGlow/30 text-amberGlow';
    }
  }

  const quotientEl = document.getElementById('telemetry-quotient-katex');
  if (quotientEl) {
    const slopeStr = formatNum(t.secantSlope, 3);
    const tex = on
      ? `\\frac{\\Delta x}{\\Delta t} = \\frac{x(t_0+\\Delta t)-x(t_0)}{\\Delta t} \\approx ${slopeStr}`
      : `\\frac{\\Delta y}{\\Delta x} = \\frac{f(x_0+\\Delta x)-f(x_0)}{\\Delta x} \\approx ${slopeStr}`;
    typesetMath(quotientEl, tex, true);
  }
}

// ---------------------------------------------------------------------------
// STAGE 2 — Curve & Derivative Intuition (`intuition`)
// ---------------------------------------------------------------------------

function mountStage2Intuition(container) {
  const on = isMechatronicsLens();
  const stats = getMasterySnapshot();
  let activeSubTab = 'lab'; // 'lab' | 'quiz' on mobile (<lg)

  container.innerHTML = `
    <section class="space-y-3 lg:space-y-6 view-enter">
      <!-- Mobile Segmented Sub-Tab Switcher (<lg) so Explorer & Visual Quiz never force long vertical scrolling -->
      <div class="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0E121C]/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <button
          type="button"
          data-stage2-subtab="lab"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm"
        >
          📈 3-Graph Explorer
        </button>
        <button
          type="button"
          data-stage2-subtab="quiz"
          class="py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white"
        >
          🎯 Match Quiz (${stats.solvedVisual}/${stats.totalVisual})
        </button>
      </div>

      <!-- Stacked Interactive Curve Lab -->
      <div id="stage2-panel-lab" class="glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-cyanGlow">Interactive Dual-Graph Lab</div>
            <h2 id="stage2-lab-title" class="font-display font-bold text-xl text-white mt-0.5">
              ${on ? 'Synchronized Position x(t) & Velocity v(t)' : "Synchronized f(x) & Derivative f'(x)"}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scrub along the curve to see how peaks, troughs, and inflection points map directly to zeros and extrema in the derivative.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
            Hover or drag cursor across graph
          </span>
        </div>

        <div id="stacked-derivative-lab-host" class="w-full min-h-[300px] sm:min-h-[380px]"></div>

        <div class="lg:hidden flex justify-end pt-0.5">
          <button
            type="button"
            id="btn-mobile-jump-quiz"
            class="btn-glow-cyan !py-2 !px-3.5 !text-xs !rounded-xl w-full"
          >
            Test Your Intuition: Match the Derivative Quiz →
          </button>
        </div>
      </div>

      <!-- Visual "Match the Derivative" Quiz Engine -->
      <div id="stage2-panel-quiz" class="hidden lg:block glass-panel p-2.5 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4">
        <div class="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-violetGlow">Visual Pattern Mastery</div>
            <h2 class="font-display font-bold text-xl text-white mt-0.5">Match the Derivative Challenges</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              Inspect slope signs, horizontal tangents, and steepness on the top curve—then pick its matching derivative graph.
            </p>
          </div>
          <button
            id="btn-next-solver"
            type="button"
            class="btn-glass !text-xs"
          >
            Next: Step Solver →
          </button>
        </div>

        <div id="visual-quiz-engine-host" class="w-full min-h-[280px] sm:min-h-[320px]"></div>
      </div>
    </section>
  `;

  const panelLab = document.getElementById('stage2-panel-lab');
  const panelQuiz = document.getElementById('stage2-panel-quiz');
  const setSubTab = (tab) => {
    activeSubTab = tab;
    if (panelLab && panelQuiz) {
      panelLab.classList.toggle('hidden', tab !== 'lab');
      panelLab.classList.add('lg:block');
      panelQuiz.classList.toggle('hidden', tab !== 'quiz');
      panelQuiz.classList.add('lg:block');
    }
    container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-stage2-subtab') === tab;
      btn.className = isAct
        ? 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer bg-cyanGlow/20 border border-cyanGlow/45 text-cyan-100 shadow-sm'
        : 'py-2 px-3 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white';
    });
    // Force crisp high-DPI canvas redraw immediately after un-hiding on mobile
    requestAnimationFrame(() => {
      if (tab === 'lab') {
        activeInstances.stackedLab?._resizeAll?.();
        activeInstances.stackedLab?._drawAll?.();
      } else {
        activeInstances.quizEngine?._resizeCanvases?.();
        activeInstances.quizEngine?._drawCanvases?.();
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  container.querySelectorAll('[data-stage2-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-stage2-subtab');
      if (next && next !== activeSubTab) {
        playSfx('tick');
        setSubTab(next);
      }
    });
  });

  document.getElementById('btn-mobile-jump-quiz')?.addEventListener('click', () => {
    playSfx('tick');
    setSubTab('quiz');
  });

  const labHost = document.getElementById('stacked-derivative-lab-host');
  if (labHost && typeof StackedDerivativeLab === 'function') {
    try {
      activeInstances.stackedLab = new StackedDerivativeLab(labHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onInteract: () => markStageDone('intuition'),
        onComplete: () => markStageDone('intuition'),
      });
    } catch (err) {
      console.error('[EIGENLAB] StackedDerivativeLab mount error:', err);
    }
  }

  const quizHost = document.getElementById('visual-quiz-engine-host');
  if (quizHost && typeof VisualQuizEngine === 'function') {
    try {
      const updateQuizTabCount = () => {
        const s = getMasterySnapshot();
        const quizBtn = container.querySelector('[data-stage2-subtab="quiz"]');
        if (quizBtn) quizBtn.textContent = `🎯 Match Quiz (${s.solvedVisual}/${s.totalVisual})`;
      };
      activeInstances.quizEngine = new VisualQuizEngine(quizHost, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onAnswer: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
        onProgress: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
        onComplete: () => {
          markStageDone('intuition');
          updateLessonStageDotsUI();
          updateQuizTabCount();
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] VisualQuizEngine mount error:', err);
    }
  }

  document.getElementById('btn-next-solver')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('solver');
  });
}

// ---------------------------------------------------------------------------
// STAGE 3 — Paperless Step Solver (`solver`)
// ---------------------------------------------------------------------------

function mountStage3Solver(container) {
  container.innerHTML = `
    <section class="max-w-4xl mx-auto space-y-3 sm:space-y-5 view-enter">
      <div class="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-[0.14em] text-emeraldGlow">Interactive Symbolic Drill</div>
          <h2 class="font-display font-bold text-2xl text-white mt-0.5">Paperless Step-by-Step Derivative Solver</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
            Identify the differentiation rule, verify each algebraic transformation, and build muscle memory across 12 curated engineering problems.
          </p>
        </div>

        <button
          id="btn-next-word-problems"
          type="button"
          class="btn-glass !text-xs"
        >
          Next: Word Problems →
        </button>
      </div>

      <div id="paperless-solver-host" class="glass-panel p-2.5 sm:p-5 md:p-6 min-h-[420px]"></div>
    </section>
  `;

  const host = document.getElementById('paperless-solver-host');
  if (host && typeof PaperlessStepSolver === 'function') {
    try {
      activeInstances.stepSolver = new PaperlessStepSolver(host, {
        mechatronicsLens: isMechatronicsLens(),
        lens: isMechatronicsLens() ? 'mechatronics' : 'math',
        onSolve: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProblemSolved: () => {
          markStageDone('solver');
          updateLessonStageDotsUI();
        },
        onProgress: (info) => {
          if (!info || (info.solvedCount ?? 1) >= 1) {
            markStageDone('solver');
            updateLessonStageDotsUI();
          }
        },
      });
    } catch (err) {
      console.error('[EIGENLAB] PaperlessStepSolver mount error:', err);
    }
  }

  if (getMasterySnapshot().solvedProblems >= 1) {
    markStageDone('solver');
  }

  document.getElementById('btn-next-word-problems')?.addEventListener('click', () => {
    playSfx('tick');
    switchStage('word-problems');
  });
}

// ---------------------------------------------------------------------------
// STAGE 4 — Applied Word Problems Queue (`word-problems`)
// ---------------------------------------------------------------------------

function enrichPlannedTopic(entry, idx) {
  const defaultAccents = ['amber', 'cyan', 'violet', 'emerald'];
  if (typeof entry === 'string') {
    const meta = PLANNED_TOPIC_METADATA[entry] || {};
    return {
      title: entry,
      domain: meta.domain || ['Mechatronics', 'Electronics', 'Physics', 'AI & ML'][idx % 4],
      accent: meta.accent || defaultAccents[idx % 4],
      equation: meta.equation || '',
      summary:
        meta.summary ||
        'Interactive real-world engineering modeling problem queued for this module.',
    };
  }
  const title = entry?.title || entry?.name || 'Engineering Topic';
  const meta = PLANNED_TOPIC_METADATA[title] || {};
  return {
    title,
    domain: entry?.domain || entry?.tag || meta.domain || 'Engineering',
    accent: entry?.accent || meta.accent || defaultAccents[idx % 4],
    equation: entry?.equation || entry?.latex || entry?.previewEquation || meta.equation || '',
    summary: entry?.summary || entry?.description || meta.summary || '',
  };
}

function mountStage4WordProblems(container) {
  if (!container) return;

  const data = appState.wordProblems || FALLBACK_WORD_PROBLEMS;
  const problems = Array.isArray(data.problems) ? data.problems : [];
  const rawPlanned =
    Array.isArray(data.plannedTopics) && data.plannedTopics.length
      ? data.plannedTopics
      : FALLBACK_WORD_PROBLEMS.plannedTopics;
  const plannedTopics = rawPlanned.map(enrichPlannedTopic);
  const isComingSoon = data.status === 'coming_soon' && problems.length === 0;

  container.innerHTML = `
    <section class="max-w-5xl mx-auto space-y-6 view-enter">
      <!-- Engineering Blueprint Header Card -->
      <div class="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div class="pointer-events-none absolute inset-0 opacity-[0.06]" style="background-image: linear-gradient(to right, #22D3EE 1px, transparent 1px), linear-gradient(to bottom, #22D3EE 1px, transparent 1px); background-size: 28px 28px;"></div>

        <div class="relative flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2 max-w-2xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${
                isComingSoon
                  ? 'bg-amberGlow/15 border-amberGlow/40 text-amberGlow'
                  : 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emeraldGlow'
              }">
                <span class="w-1.5 h-1.5 rounded-full ${isComingSoon ? 'bg-amberGlow animate-pulse' : 'bg-emeraldGlow'}"></span>
                ${
                  isComingSoon
                    ? 'status: coming_soon'
                    : `${problems.length} Active Problem${problems.length === 1 ? '' : 's'} Ready`
                }
              </span>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/10 text-slate-300">
                Engineering Blueprint Preview
              </span>
            </div>

            <h2 class="font-display font-bold text-2xl sm:text-3xl text-white">
              ${escapeHtml(data.title || 'Applied Engineering Word Problems')}
            </h2>
            <p class="text-sm text-slate-300/90 leading-relaxed">
              ${escapeHtml(
                data.subtitle ||
                  'Translate physical mechatronics, electronics, thermal, and machine learning narratives into differential models and solve them interactively.'
              )}
            </p>
          </div>

          <button
            id="btn-mark-blueprint-reviewed"
            type="button"
            class="btn-glass !text-xs !font-mono shrink-0"
          >
            ${isStageDone('word-problems') ? '✓ Stage 4 Reviewed' : 'Mark Stage 4 Reviewed'}
          </button>
        </div>

        <!-- Auto-Activation Architectural Note -->
        <div class="relative mt-6 rounded-2xl p-4 bg-[#080A0F]/80 border border-cyanGlow/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <span class="text-lg leading-none mt-0.5" aria-hidden="true">📐</span>
            <div class="text-xs text-slate-300 leading-relaxed">
              <strong class="text-white">Automatic Activation:</strong> Dropping structured word problems into
              <code class="px-1.5 py-0.5 rounded bg-white/10 text-cyanGlow font-mono">data/lessons/derivatives-word-problems.json</code>
              activates them automatically in this stage without modifying any app code.
            </div>
          </div>
          <span class="shrink-0 text-[11px] font-mono text-slate-400">
            ${problems.length} loaded
          </span>
        </div>
      </div>

      ${
        problems.length > 0
          ? `
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-semibold text-lg text-white">Active Word Problems (${problems.length})</h3>
                <span class="status-live">Ready</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${problems
                  .map(
                    (prob, idx) => `
                      <article class="glass-card p-5 space-y-2.5 !border-emeraldGlow/25">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[11px] font-mono text-emeraldGlow uppercase">Problem ${idx + 1}</span>
                          ${
                            prob.domain
                              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-slate-300 border border-white/10">${escapeHtml(prob.domain)}</span>`
                              : ''
                          }
                        </div>
                        <h4 class="font-display font-semibold text-base text-white">${escapeHtml(prob.title || `Applied Problem ${idx + 1}`)}</h4>
                        <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(prob.prompt || prob.description || '')}</p>
                        ${
                          prob.equation || prob.latex
                            ? `<div class="katex-card !py-2.5"><span data-wp-katex="${escapeHtml(prob.equation || prob.latex)}"></span></div>`
                            : ''
                        }
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </div>
          `
          : ''
      }

      <!-- 4 Planned Engineering Topics Grid -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-semibold text-lg text-white">Upcoming Engineering Problem Modules</h3>
          <span class="text-xs font-mono text-slate-400">${plannedTopics.length} Planned Tracks</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${plannedTopics
            .map((topic) => {
              const accent = getAccentClasses(topic.accent);
              return `
                <article class="glass-card p-5 ${accent.border} flex flex-col justify-between gap-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${accent.badge}">
                        ${escapeHtml(topic.domain)}
                      </span>
                      <span class="status-planned !text-[10px]">Queued</span>
                    </div>
                    <h4 class="font-display font-semibold text-base text-white">
                      ${escapeHtml(topic.title)}
                    </h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                      ${escapeHtml(topic.summary)}
                    </p>
                  </div>

                  ${
                    topic.equation
                      ? `
                        <div class="katex-card !py-3 flex items-center justify-center min-h-[54px]">
                          <span data-wp-katex="${escapeHtml(topic.equation)}" class="text-slate-100 text-sm"></span>
                        </div>
                      `
                      : ''
                  }
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-wp-katex]').forEach((el) => {
    const tex = el.getAttribute('data-wp-katex');
    if (tex) typesetMath(el, tex, false);
  });

  document.getElementById('btn-mark-blueprint-reviewed')?.addEventListener('click', () => {
    playSfx('success');
    markStageDone('word-problems');
    const btn = document.getElementById('btn-mark-blueprint-reviewed');
    if (btn) btn.textContent = '✓ Stage 4 Reviewed';
  });
}

// ---------------------------------------------------------------------------
// Data Loading & KaTeX Readiness Boot Sequence
// ---------------------------------------------------------------------------

async function fetchJsonSafe(url, fallback) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[EIGENLAB] Could not fetch ${url}, using fallback:`, err);
    return fallback;
  }
}

function waitForKatex(timeoutMs = 2500) {
  return new Promise((resolve) => {
    if (window.katex) {
      resolve();
      return;
    }
    const start = performance.now();
    const check = () => {
      if (window.katex || performance.now() - start >= timeoutMs) {
        resolve();
      } else {
        setTimeout(check, 40);
      }
    };
    check();
  });
}

function subscribeToStoreUpdates() {
  if (typeof store?.subscribe !== 'function') return;
  store.subscribe(() => {
    const stats = getMasterySnapshot();
    if (stats.solvedProblems >= 1 && !isStageDone('solver')) {
      store.markStageComplete('solver');
    }
    if (stats.solvedVisual >= 1 && !isStageDone('intuition')) {
      store.markStageComplete('intuition');
    }

    if (appState.view === 'lesson') {
      updateLessonStageDotsUI();
    } else if (appState.view === 'hub') {
      const streakEl = document.getElementById('hub-header-streak');
      if (streakEl) streakEl.textContent = String(stats.streak);
    }
  });
}

async function boot() {
  const [curriculum, wordProblems] = await Promise.all([
    fetchJsonSafe('./data/curriculum.json', FALLBACK_CURRICULUM),
    fetchJsonSafe('./data/lessons/derivatives-word-problems.json', FALLBACK_WORD_PROBLEMS),
    waitForKatex(),
  ]);

  if (curriculum && Array.isArray(curriculum.domains)) {
    appState.curriculum = curriculum;
  }
  if (wordProblems && typeof wordProblems === 'object') {
    appState.wordProblems = wordProblems;
  }

  subscribeToStoreUpdates();

  window.addEventListener('beforeunload', () => {
    disposeActiveWidgets();
  });

  renderHubView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
