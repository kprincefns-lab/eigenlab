/**
 * EIGENLAB — Persistent State Store, Tactile Web Audio Engine & KaTeX Helpers
 * Native ES Module (zero external dependencies)
 */

const STORAGE_KEY = 'eigenlab_state_v1';

const TOTAL_STAGES = 12;
const TARGET_PROBLEMS = 46;
const TARGET_QUIZZES = 20;

const DEFAULT_STATE = Object.freeze({
  completedStages: [],
  solvedProblems: [],
  solvedQuizzes: [],
  accuracyStreak: 0,
  bestStreak: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  activeLens: 'math',
  muted: false,
});

function cloneState(src) {
  return {
    completedStages: [...src.completedStages],
    solvedProblems: [...src.solvedProblems],
    solvedQuizzes: [...src.solvedQuizzes],
    accuracyStreak: src.accuracyStreak,
    bestStreak: src.bestStreak,
    totalAttempts: src.totalAttempts,
    correctAttempts: src.correctAttempts,
    activeLens: src.activeLens,
    muted: src.muted,
  };
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    if (typeof item === 'string' && item.length > 0 && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function sanitizeNonNegInt(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function loadInitialState() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return cloneState(DEFAULT_STATE);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneState(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return cloneState(DEFAULT_STATE);
    }
    const accuracyStreak = sanitizeNonNegInt(parsed.accuracyStreak);
    const bestStreak = Math.max(accuracyStreak, sanitizeNonNegInt(parsed.bestStreak));
    const totalAttempts = sanitizeNonNegInt(parsed.totalAttempts);
    const correctAttempts = Math.min(totalAttempts, sanitizeNonNegInt(parsed.correctAttempts));
    const activeLens = parsed.activeLens === 'mechatronics' ? 'mechatronics' : 'math';
    const muted = Boolean(parsed.muted);

    return {
      completedStages: sanitizeArray(parsed.completedStages),
      solvedProblems: sanitizeArray(parsed.solvedProblems),
      solvedQuizzes: sanitizeArray(parsed.solvedQuizzes),
      accuracyStreak,
      bestStreak,
      totalAttempts,
      correctAttempts,
      activeLens,
      muted,
    };
  } catch {
    return cloneState(DEFAULT_STATE);
  }
}

let state = loadInitialState();
const listeners = new Set();

function persistState() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota or private-mode restrictions safely
  }
}

function notify() {
  const snapshot = cloneState(state);
  for (const fn of listeners) {
    try {
      fn(snapshot);
    } catch (err) {
      console.error('[EIGENLAB store] subscriber error:', err);
    }
  }
}

function commit(mutator) {
  const changed = mutator();
  if (changed !== false) {
    persistState();
    notify();
  }
}

export const store = {
  getState() {
    return cloneState(state);
  },

  subscribe(fn) {
    if (typeof fn !== 'function') {
      return () => {};
    }
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  markStageComplete(stageId) {
    if (typeof stageId !== 'string' || !stageId) return;
    commit(() => {
      if (state.completedStages.includes(stageId)) return false;
      state.completedStages = [...state.completedStages, stageId];
      return true;
    });
  },

  markProblemSolved(problemId) {
    if (typeof problemId !== 'string' || !problemId) return;
    commit(() => {
      if (state.solvedProblems.includes(problemId)) return false;
      state.solvedProblems = [...state.solvedProblems, problemId];
      return true;
    });
  },

  markQuizSolved(quizId) {
    if (typeof quizId !== 'string' || !quizId) return;
    commit(() => {
      if (state.solvedQuizzes.includes(quizId)) return false;
      state.solvedQuizzes = [...state.solvedQuizzes, quizId];
      return true;
    });
  },

  recordAttempt(isCorrect) {
    const correct = Boolean(isCorrect);
    commit(() => {
      state.totalAttempts += 1;
      if (correct) {
        state.correctAttempts += 1;
        state.accuracyStreak += 1;
        if (state.accuracyStreak > state.bestStreak) {
          state.bestStreak = state.accuracyStreak;
        }
      } else {
        state.accuracyStreak = 0;
      }
      return true;
    });
  },

  setActiveLens(lens) {
    const nextLens = lens === 'mechatronics' ? 'mechatronics' : 'math';
    commit(() => {
      if (state.activeLens === nextLens) return false;
      state.activeLens = nextLens;
      return true;
    });
  },

  toggleLens() {
    const nextLens = state.activeLens === 'math' ? 'mechatronics' : 'math';
    this.setActiveLens(nextLens);
    return nextLens;
  },

  setMuted(muted) {
    const nextMuted = Boolean(muted);
    commit(() => {
      if (state.muted === nextMuted) return false;
      state.muted = nextMuted;
      return true;
    });
  },

  toggleMute() {
    const nextMuted = !state.muted;
    this.setMuted(nextMuted);
    return nextMuted;
  },

  getMasteryStats() {
    const completedStagesCount = state.completedStages.length;
    const solvedProblemsCount = state.solvedProblems.length;
    const solvedQuizzesCount = state.solvedQuizzes.length;
    const accuracyPct =
      state.totalAttempts > 0
        ? Math.round((state.correctAttempts / state.totalAttempts) * 100)
        : 100;
    const streak = state.accuracyStreak;

    const stageRatio = Math.min(1, completedStagesCount / TOTAL_STAGES);
    const problemRatio = Math.min(1, solvedProblemsCount / TARGET_PROBLEMS);
    const quizRatio = Math.min(1, solvedQuizzesCount / TARGET_QUIZZES);
    const overallPct = Math.min(
      100,
      Math.round(stageRatio * 40 + problemRatio * 35 + quizRatio * 25)
    );

    return {
      completedStagesCount,
      solvedProblemsCount,
      solvedQuizzesCount,
      accuracyPct,
      streak,
      bestStreak: state.bestStreak,
      overallPct,
    };
  },

  resetProgress() {
    commit(() => {
      state = cloneState(DEFAULT_STATE);
      return true;
    });
  },
};

/* ==========================================================================
   Lightweight Web Audio API Tactile Synthesizer
   ========================================================================== */

let audioCtx = null;
let lastTickMs = 0;

function getAudioContext() {
  if (state.muted) return null;
  if (typeof window === 'undefined') return null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Subtle tactile micro-click for sliders and precision UI controls
 */
export function playTick() {
  const nowMs = performance.now();
  if (nowMs - lastTickMs < 28) return;
  lastTickMs = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.018);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.042, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.024);
  } catch {
    // Audio playback safely ignored
  }
}

/**
 * Clean harmonic crystal snap for locking a step into the working ledger
 */
export function playSnap() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const notes = [
      { freq: 587.33, peak: 0.075, dur: 0.16, type: 'sine' },     // D5
      { freq: 880.0, peak: 0.045, dur: 0.14, type: 'triangle' },  // A5
      { freq: 1174.66, peak: 0.03, dur: 0.11, type: 'sine' },     // D6
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(n.peak, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.dur + 0.01);
    }
  } catch {
    // Audio playback safely ignored
  }
}

/**
 * Warm ascending triad chime for solving a problem or challenge
 */
export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    // C5 -> E5 -> G5 -> C6 warm major triad shimmer
    const sequence = [
      { freq: 523.25, delay: 0.0, peak: 0.07, dur: 0.32 },
      { freq: 659.25, delay: 0.065, peak: 0.07, dur: 0.34 },
      { freq: 783.99, delay: 0.13, peak: 0.075, dur: 0.38 },
      { freq: 1046.5, delay: 0.195, peak: 0.06, dur: 0.48 },
    ];

    for (const note of sequence) {
      const start = t + note.delay;
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, start);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(note.freq * 2, start);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.18, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(note.peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

      osc.connect(gain);
      harmonic.connect(harmGain);
      harmGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      harmonic.start(start);
      osc.stop(start + note.dur + 0.02);
      harmonic.stop(start + note.dur + 0.02);
    }
  } catch {
    // Audio playback safely ignored
  }
}

/**
 * Soft muted low double-thud for gentle error feedback (never harsh)
 */
export function playGentleError() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const pulses = [
      { freqStart: 196, freqEnd: 162, delay: 0.0 },
      { freqStart: 164, freqEnd: 132, delay: 0.095 },
    ];

    for (const p of pulses) {
      const start = t + p.delay;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freqStart, start);
      osc.frequency.exponentialRampToValueAtTime(p.freqEnd, start + 0.085);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.075, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.11);
    }
  } catch {
    // Audio playback safely ignored
  }
}

export const sound = {
  playTick,
  playSnap,
  playSuccess,
  playGentleError,
};

/* ==========================================================================
   KaTeX Safe Rendering Helpers
   ========================================================================== */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely render LaTeX into a DOM element via KaTeX with plain-text fallback
 */
export function renderKatex(el, latex, displayMode = false) {
  if (!el) return;
  const expr = latex == null ? '' : String(latex);

  if (
    typeof window !== 'undefined' &&
    window.katex &&
    typeof window.katex.render === 'function'
  ) {
    try {
      window.katex.render(expr, el, {
        displayMode: Boolean(displayMode),
        throwOnError: false,
        strict: false,
      });
      return;
    } catch {
      // Fall through to plain text fallback
    }
  }

  el.textContent = expr;
}

/**
 * Render prose containing inline `$...$` or display `$$...$$` LaTeX segments into safe HTML
 */
export function renderInlineMathText(text) {
  if (text == null) return '';
  const input = String(text);

  const hasKatex =
    typeof window !== 'undefined' &&
    window.katex &&
    typeof window.katex.renderToString === 'function';

  // Match escaped \$, display $$...$$, or inline $...$
  const tokenRegex = /\\\$|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(input.slice(lastIndex, match.index));
    }

    if (match[0] === '\\$') {
      result += '$';
    } else {
      const isDisplay = match[1] !== undefined;
      const expr = (isDisplay ? match[1] : match[2]).trim();
      if (hasKatex) {
        try {
          const rendered = window.katex.renderToString(expr, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: false,
          });
          result += isDisplay
            ? `<span class="katex-block">${rendered}</span>`
            : `<span class="katex-inline">${rendered}</span>`;
        } catch {
          result += `<span class="katex-inline font-mono">${escapeHtml(expr)}</span>`;
        }
      } else {
        result += `<span class="katex-inline font-mono">${escapeHtml(expr)}</span>`;
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < input.length) {
    result += escapeHtml(input.slice(lastIndex));
  }

  return result;
}
