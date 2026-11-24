/**
 * EIGENLAB — Paperless Multi-Step Symbolic Derivative Solver
 * Zero scratch paper required: every completed micro-step locks into a persistent
 * Working Step Ledger directly above tactile KaTeX choice tiles, culminating in
 * a high-DPI interactive dual-curve numerical slope verification plot.
 */

import { DERIVATIVE_PROBLEMS, SOLVER_TIERS } from '../../data/lessons/derivatives-problems.js';
import { store, sound, renderKatex, renderInlineMathText } from '../store.js';

const CHEAT_SHEET_RULES = [
  {
    name: 'Power Rule',
    tag: 'Algebraic',
    latex:
      '\\frac{d}{dx}\\!\\left(\\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}}\\right) = \\textcolor{#34D399}{\\textcolor{#F59E0B}{n}\\,\\textcolor{#22D3EE}{x}^{\\textcolor{#F59E0B}{n}-1}}',
  },
  {
    name: 'Constant & Linearity',
    tag: 'Linearity',
    latex:
      '\\frac{d}{dx}(c) = \\textcolor{#34D399}{0}, \\quad \\frac{d}{dx}(a\\textcolor{#22D3EE}{u} \\pm b\\textcolor{#F59E0B}{v}) = a\\textcolor{#34D399}{u\'} \\pm b\\textcolor{#34D399}{v\'}',
  },
  {
    name: 'Product Rule',
    tag: 'u · v',
    latex:
      '(\\textcolor{#22D3EE}{u}\\,\\textcolor{#F59E0B}{v})\' = \\textcolor{#34D399}{u\'}\\textcolor{#F59E0B}{v} + \\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v\'}',
  },
  {
    name: 'Quotient Rule',
    tag: 'u / v',
    latex:
      '\\left(\\frac{\\textcolor{#22D3EE}{u}}{\\textcolor{#F59E0B}{v}}\\right)\' = \\frac{\\textcolor{#34D399}{u\'}\\textcolor{#F59E0B}{v} - \\textcolor{#22D3EE}{u}\\textcolor{#34D399}{v\'}}{\\textcolor{#F59E0B}{v}^2}',
  },
  {
    name: 'Chain Rule',
    tag: 'Outer(Inner)',
    latex:
      '\\frac{d}{dx}\\,\\textcolor{#22D3EE}{g}\\!\\big(\\textcolor{#F59E0B}{u(x)}\\big) = \\textcolor{#34D399}{g\'}(\\textcolor{#F59E0B}{u}) \\cdot \\textcolor{#34D399}{u\'(x)}',
  },
  {
    name: 'Trigonometric',
    tag: 'sin / cos / tan',
    latex:
      '(\\sin x)\' = \\textcolor{#34D399}{\\cos x}, \\;\; (\\cos x)\' = \\textcolor{#34D399}{-\\sin x}, \\;\; (\\tan x)\' = \\textcolor{#34D399}{\\sec^2 x}',
  },
  {
    name: 'Exponential & Log',
    tag: 'e^x / ln x',
    latex:
      '(e^x)\' = \\textcolor{#34D399}{e^x}, \\qquad (\\ln x)\' = \\textcolor{#34D399}{\\frac{1}{x}} \\;\;(x > 0)',
  },
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNum(val, decimals = 4) {
  if (!Number.isFinite(val)) return '—';
  const rounded = Math.abs(val) < 5e-6 ? 0 : val;
  if (Math.abs(rounded) >= 10000) {
    return rounded.toExponential(3);
  }
  return rounded.toFixed(decimals);
}

function formatAxisTick(val) {
  if (!Number.isFinite(val)) return '';
  if (Math.abs(val) < 1e-6) return '0';
  if (Math.abs(val) >= 10000) return `${(val / 1000).toFixed(0)}k`;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
  if (Math.abs(val) >= 100) return val.toFixed(0);
  if (Math.abs(val) >= 10) return val.toFixed(1);
  return val.toFixed(2).replace(/\.?0+$/, '');
}

function centralDiff(fn, x, h = 1e-5) {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

export class PaperlessStepSolver {
  /**
   * Supports both calling conventions:
   *  - new PaperlessStepSolver({ mechatronicsLens, onProblemSolved }) + solver.mount(el)
   *  - new PaperlessStepSolver(containerEl, { mechatronicsLens, onProblemSolved })
   */
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    const isElement =
      containerOrOptions &&
      typeof containerOrOptions === 'object' &&
      typeof containerOrOptions.appendChild === 'function';

    const options = isElement ? maybeOptions || {} : containerOrOptions || {};

    this.mechatronicsLens = Boolean(
      options.mechatronicsLens ?? options.lens === 'mechatronics'
    );
    this.onProblemSolved =
      typeof options.onProblemSolved === 'function' ? options.onProblemSolved : null;
    this.onSolve = typeof options.onSolve === 'function' ? options.onSolve : null;
    this.onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    this.container = null;
    this.activeTier = 'all';
    this.activeProblemId = DERIVATIVE_PROBLEMS[0]?.id ?? null;

    // Step progression state for the currently active problem
    this.currentStepIndex = 0;
    this.completedSteps = []; // Array of step objects locked into the ledger
    this.wrongOptionIds = new Set();
    this.activeMisconception = null;
    this.hintVisible = false;
    this.cheatSheetOpen = false;
    this.mobilePickerOpen = false;
    this.isProblemCompleted = false;
    this.isAdvancing = false;
    this.newlyLockedIndex = -1;

    // Verification canvas state
    this.verifyCanvas = null;
    this.verifyCursorX = null;
    this.isDraggingVerify = false;
    this.verifyPlotGeom = null;

    // Lifecycle handles
    this._advanceTimer = null;
    this._resizeObserver = null;
    this._unsubscribeStore = null;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundCanvasPointerDown = this._handleCanvasPointerDown.bind(this);
    this._boundCanvasPointerMove = this._handleCanvasPointerMove.bind(this);
    this._boundCanvasPointerUp = this._handleCanvasPointerUp.bind(this);
    this._boundCanvasPointerLeave = this._handleCanvasPointerLeave.bind(this);

    if (isElement) {
      this.mount(containerOrOptions);
    }
  }

  /* ========================================================================
     Public API
     ======================================================================== */

  mount(container) {
    if (!container) return this;
    this.dispose();

    this.container = container;
    this.container.classList.add('eigenlab-step-solver');

    // Sync initial solved state from persistent store
    this._unsubscribeStore = store.subscribe(() => {
      if (this.container && this.container.isConnected) {
        this._updateSolvedBadges();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._boundKeyDown);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        if (this.isProblemCompleted && this.verifyCanvas) {
          this._drawVerificationCanvas();
        }
      });
      this._resizeObserver.observe(this.container);
    }

    this._render();
    return this;
  }

  setMechatronicsLens(bool) {
    const next = Boolean(bool);
    if (this.mechatronicsLens === next) return;
    this.mechatronicsLens = next;
    this._updateMechatronicsPill();
  }

  setLens(lens) {
    this.setMechatronicsLens(lens === 'mechatronics' || lens === true);
  }

  selectProblem(problemId) {
    const target = DERIVATIVE_PROBLEMS.find((p) => p.id === problemId);
    if (!target) return;

    if (this.activeTier !== 'all' && target.tier !== this.activeTier) {
      this.activeTier = 'all';
    }

    this.activeProblemId = target.id;
    this._resetActiveProblemState();
    this._render();
  }

  dispose() {
    if (this._advanceTimer) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = null;
    }
    this._detachCanvasListeners();

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._boundKeyDown);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._unsubscribeStore) {
      this._unsubscribeStore();
      this._unsubscribeStore = null;
    }

    this.verifyCanvas = null;
    this.container = null;
  }

  /* ========================================================================
     Internal Data Helpers
     ======================================================================== */

  _getSolvedSet() {
    const st = store?.getState?.();
    const list = Array.isArray(st?.solvedProblems) ? st.solvedProblems : [];
    return new Set(list);
  }

  _getFilteredProblems() {
    if (this.activeTier === 'all') return DERIVATIVE_PROBLEMS;
    return DERIVATIVE_PROBLEMS.filter((p) => p.tier === this.activeTier);
  }

  _getActiveProblem() {
    return (
      DERIVATIVE_PROBLEMS.find((p) => p.id === this.activeProblemId) ||
      DERIVATIVE_PROBLEMS[0]
    );
  }

  _resetActiveProblemState() {
    if (this._advanceTimer) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = null;
    }
    this.currentStepIndex = 0;
    this.completedSteps = [];
    this.wrongOptionIds = new Set();
    this.activeMisconception = null;
    this.hintVisible = false;
    this.isProblemCompleted = false;
    this.isAdvancing = false;
    this.newlyLockedIndex = -1;
    this.verifyCursorX = null;
    this.isDraggingVerify = false;
  }

  _setTier(tierId) {
    if (this.activeTier === tierId) return;
    sound?.playTick?.();
    this.activeTier = tierId;
    const filtered = this._getFilteredProblems();
    if (filtered.length && !filtered.some((p) => p.id === this.activeProblemId)) {
      this.activeProblemId = filtered[0].id;
      this._resetActiveProblemState();
    }
    this._render();
  }

  _navigateRelative(delta) {
    const list = this._getFilteredProblems();
    if (!list.length) return;
    const idx = list.findIndex((p) => p.id === this.activeProblemId);
    const nextIdx = (idx + delta + list.length) % list.length;
    sound?.playTick?.();
    this.activeProblemId = list[nextIdx].id;
    this._resetActiveProblemState();
    this._render();
  }

  _toggleCheatSheet() {
    sound?.playTick?.();
    this.cheatSheetOpen = !this.cheatSheetOpen;
    const drawer = this.container?.querySelector('[data-cheat-drawer]');
    const btns = this.container?.querySelectorAll('[data-cheat-toggle], [data-cheat-toggle-mobile]') || [];
    if (drawer && btns.length) {
      drawer.classList.toggle('hidden', !this.cheatSheetOpen);
      btns.forEach((btn) => {
        btn.setAttribute('aria-expanded', String(this.cheatSheetOpen));
        btn.classList.toggle('border-cyanGlow/50', this.cheatSheetOpen);
        btn.classList.toggle('bg-cyanGlow/15', this.cheatSheetOpen);
        btn.classList.toggle('text-cyan-200', this.cheatSheetOpen);
      });
    } else {
      this._render();
    }
  }

  _toggleMobilePicker() {
    sound?.playTick?.();
    this.mobilePickerOpen = !this.mobilePickerOpen;
    const drawer = this.container?.querySelector('[data-mobile-picker-drawer]');
    const btn = this.container?.querySelector('[data-mobile-picker-toggle]');
    if (drawer && btn) {
      drawer.classList.toggle('hidden', !this.mobilePickerOpen);
      drawer.classList.toggle('flex', this.mobilePickerOpen);
      btn.setAttribute('aria-expanded', String(this.mobilePickerOpen));
      btn.classList.toggle('border-cyanGlow/50', this.mobilePickerOpen);
      btn.classList.toggle('border-white/10', !this.mobilePickerOpen);
      const arrow = btn.querySelector('span:last-child span:last-child');
      if (arrow) arrow.textContent = this.mobilePickerOpen ? '▲' : '▼';
    } else {
      this._render();
    }
  }

  _toggleHint() {
    if (this.isProblemCompleted) return;
    sound?.playTick?.();
    this.hintVisible = !this.hintVisible;
    const box = this.container?.querySelector('[data-hint-box]');
    const btn = this.container?.querySelector('[data-hint-btn]');
    if (box && btn) {
      box.classList.toggle('hidden', !this.hintVisible);
      btn.setAttribute('aria-expanded', String(this.hintVisible));
    } else {
      this._render();
    }
  }

  /* ========================================================================
     Option Selection & Keyboard Handling
     ======================================================================== */

  _handleOptionSelect(optionId) {
    if (this.isProblemCompleted || this.isAdvancing) return;

    const problem = this._getActiveProblem();
    const step = problem?.steps?.[this.currentStepIndex];
    if (!step) return;

    const option = step.options.find((o) => o.id === optionId);
    if (!option) return;

    const tileEl = this.container?.querySelector(
      `[data-option-id="${CSS.escape(optionId)}"]`
    );

    if (option.correct) {
      this.isAdvancing = true;
      this.activeMisconception = null;
      store.recordAttempt(true);

      const isFinalStep = this.currentStepIndex >= problem.steps.length - 1;
      if (isFinalStep) {
        sound.playSuccess();
      } else {
        sound.playSnap();
      }

      // Tactile lock visual on all tiles before advancing
      const allTiles = this.container?.querySelectorAll('[data-option-id]') || [];
      allTiles.forEach((btn) => {
        btn.classList.add('is-locked');
        btn.setAttribute('disabled', 'true');
      });
      if (tileEl) {
        tileEl.classList.remove('is-wrong', 'shake-gentle');
        tileEl.classList.add('is-correct');
      }

      // Hide any previous misconception banner
      const feedbackEl = this.container?.querySelector('[data-misconception-banner]');
      if (feedbackEl) {
        feedbackEl.classList.add('hidden');
      }

      this._advanceTimer = setTimeout(() => {
        this._advanceTimer = null;
        this.completedSteps.push(step);
        this.newlyLockedIndex = this.completedSteps.length - 1;
        this.wrongOptionIds = new Set();
        this.hintVisible = false;
        this.isAdvancing = false;

        if (isFinalStep) {
          this.isProblemCompleted = true;
          this.currentStepIndex = problem.steps.length;
          const [xMin, xMax] = problem.domain;
          this.verifyCursorX = xMin + (xMax - xMin) * 0.56;

          store.markProblemSolved(problem.id);
          const solvedCount = this._getSolvedSet().size;
          const payload = {
            problemId: problem.id,
            problem,
            solvedCount,
            totalProblems: DERIVATIVE_PROBLEMS.length,
          };

          try {
            this.onProblemSolved?.(problem.id, payload);
            this.onSolve?.(problem.id, payload);
            this.onProgress?.(payload);
          } catch (err) {
            console.warn('[PaperlessStepSolver] callback error:', err);
          }
        } else {
          this.currentStepIndex += 1;
        }

        this._render();
      }, 300);
    } else {
      // Gentle error feedback + targeted misconception explanation
      sound.playGentleError();
      store.recordAttempt(false);
      this.wrongOptionIds.add(option.id);
      this.activeMisconception =
        option.misconception ||
        'Not quite—check the signs, exponents, and structure in the highlight strip above.';

      if (tileEl) {
        tileEl.classList.remove('shake-gentle');
        // Force reflow so rapid retries replay the gentle shake cleanly
        void tileEl.offsetWidth;
        tileEl.classList.add('is-wrong', 'shake-gentle');
      }

      const banner = this.container?.querySelector('[data-misconception-banner]');
      const bannerText = this.container?.querySelector('[data-misconception-text]');
      if (banner && bannerText) {
        bannerText.innerHTML = renderInlineMathText(this.activeMisconception);
        banner.classList.remove('hidden');
        banner.classList.remove('fade-in');
        void banner.offsetWidth;
        banner.classList.add('fade-in');
      } else {
        this._render();
      }
    }
  }

  _handleKeyDown(e) {
    if (!this.container || !this.container.isConnected) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tag = e.target?.tagName?.toLowerCase();
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      e.target?.isContentEditable
    ) {
      return;
    }

    if (e.key >= '1' && e.key <= '4') {
      if (this.isProblemCompleted || this.isAdvancing) return;
      const problem = this._getActiveProblem();
      const step = problem?.steps?.[this.currentStepIndex];
      const idx = Number(e.key) - 1;
      const opt = step?.options?.[idx];
      if (opt) {
        e.preventDefault();
        this._handleOptionSelect(opt.id);
      }
      return;
    }

    if (e.key === 'h' || e.key === 'H') {
      if (!this.isProblemCompleted) {
        e.preventDefault();
        this._toggleHint();
      }
      return;
    }

    if (e.key === 'Enter' && this.isProblemCompleted) {
      e.preventDefault();
      this._navigateRelative(1);
    }
  }

  /* ========================================================================
     DOM Rendering
     ======================================================================== */

  _render() {
    if (!this.container) return;
    this._detachCanvasListeners();

    const solvedSet = this._getSolvedSet();
    const totalSolved = DERIVATIVE_PROBLEMS.filter((p) => solvedSet.has(p.id)).length;
    const totalProblems = DERIVATIVE_PROBLEMS.length;
    const filteredProblems = this._getFilteredProblems();
    const problem = this._getActiveProblem();
    const globalIndex = DERIVATIVE_PROBLEMS.findIndex((p) => p.id === problem.id);
    const problemIsSolved = solvedSet.has(problem.id);

    const tierPillsHtml = SOLVER_TIERS.map((tier) => {
      const list =
        tier.id === 'all'
          ? DERIVATIVE_PROBLEMS
          : DERIVATIVE_PROBLEMS.filter((p) => p.tier === tier.id);
      const tierSolved = list.filter((p) => solvedSet.has(p.id)).length;
      const isActive = this.activeTier === tier.id;
      const allDone = list.length > 0 && tierSolved === list.length;

      return `
        <button
          type="button"
          data-tier-id="${escapeHtml(tier.id)}"
          class="stage-pill ${isActive ? 'active' : ''} ${allDone && !isActive ? 'is-complete' : ''}"
          aria-pressed="${isActive}"
        >
          <span>${escapeHtml(tier.label)}</span>
          <span class="font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
            isActive
              ? 'bg-cyanGlow/20 text-cyan-100'
              : allDone
                ? 'bg-emeraldGlow/20 text-emerald-300'
                : 'bg-white/[0.06] text-slate-400'
          }" data-tier-count="${escapeHtml(tier.id)}">${tierSolved}/${list.length}</span>
        </button>
      `;
    }).join('');

    const problemDotsHtml = filteredProblems
      .map((p) => {
        const num = DERIVATIVE_PROBLEMS.findIndex((item) => item.id === p.id) + 1;
        const active = p.id === problem.id;
        const solved = solvedSet.has(p.id);
        return `
          <button
            type="button"
            data-problem-id="${escapeHtml(p.id)}"
            title="Problem ${num}: ${escapeHtml(p.title)} (${escapeHtml(p.tierLabel)})"
            aria-label="Problem ${num}: ${escapeHtml(p.title)}${solved ? ' (Solved)' : ''}"
            aria-current="${active ? 'true' : 'false'}"
            class="inline-flex items-center justify-center gap-1 min-w-[2.1rem] h-8 px-2 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
              active
                ? 'bg-cyanGlow/20 border-cyanGlow/65 text-cyan-100 shadow-[0_0_14px_-4px_rgba(34,211,238,0.65)] scale-105'
                : solved
                  ? 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emerald-300 hover:border-emeraldGlow/70'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-100 hover:border-white/25'
            }"
          >
            <span>${num}</span>
            ${solved ? '<span class="text-emerald-300 text-[11px] leading-none">✓</span>' : ''}
          </button>
        `;
      })
      .join('');

    const cheatSheetCardsHtml = CHEAT_SHEET_RULES.map(
      (rule, i) => `
        <div class="rounded-xl p-3 bg-slate-950/75 border border-white/[0.08] flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-display text-xs font-semibold text-slate-200">${escapeHtml(rule.name)}</span>
            <span class="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400">${escapeHtml(rule.tag)}</span>
          </div>
          <div class="overflow-x-auto py-1 text-sm text-slate-100" data-cheat-formula="${i}"></div>
        </div>
      `
    ).join('');

    const ledgerRowsHtml = this.completedSteps.length
      ? this.completedSteps
          .map((st, idx) => {
            const isFresh = idx === this.newlyLockedIndex;
            return `
              <div class="ledger-row ${isFresh ? 'snap-in' : ''}">
                <div class="flex items-center gap-2.5 shrink-0">
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emeraldGlow/20 border border-emeraldGlow/45 text-emerald-300 font-mono text-xs font-semibold">
                    ${idx + 1}
                  </span>
                  <span class="chip-deriv">${escapeHtml(st.lockedLabel || st.badge)}</span>
                </div>
                <div class="overflow-x-auto max-w-full py-0.5 text-slate-100" data-ledger-latex="${idx}"></div>
              </div>
            `;
          })
          .join('')
      : `
        <div class="rounded-xl px-4 py-3 border border-dashed border-white/10 bg-white/[0.015] flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Complete Step 1 below to lock your first milestone into the Working Step Ledger.</span>
          <span class="font-mono text-[11px] text-slate-500 shrink-0">0 / ${problem.steps.length} locked</span>
        </div>
      `;

    const activeAreaHtml = this.isProblemCompleted
      ? this._buildVerificationCardHtml(problem)
      : this._buildActiveStepHtml(problem);

    this.container.innerHTML = `
      <div class="flex flex-col gap-2.5 sm:gap-5">
        <!-- TOP PROBLEM HEADER -->
        <div class="flex flex-col gap-2 sm:gap-3.5">
          <!-- Compact Mobile Problem Switcher Bar (md:hidden) -->
          <div class="flex md:hidden items-center justify-between gap-1.5">
            <button
              type="button"
              data-nav-prev-mobile
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0"
              aria-label="Previous problem"
            >
              ←
            </button>
            <button
              type="button"
              data-mobile-picker-toggle
              aria-expanded="${this.mobilePickerOpen}"
              class="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border ${
                this.mobilePickerOpen ? 'border-cyanGlow/50 text-cyan-100' : 'border-white/10 text-slate-100'
              } text-xs cursor-pointer"
            >
              <span class="flex items-center gap-1.5 min-w-0">
                <span class="font-mono font-semibold text-cyanGlow shrink-0">#${globalIndex + 1}/${totalProblems}</span>
                <span class="truncate font-medium">${escapeHtml(problem.title)}</span>
              </span>
              <span class="flex items-center gap-1.5 shrink-0">
                ${problemIsSolved ? '<span class="text-emeraldGlow text-[11px]">✓</span>' : ''}
                <span class="text-[10px] font-mono text-slate-400">${this.mobilePickerOpen ? '▲' : '▼'}</span>
              </span>
            </button>
            <button
              type="button"
              data-nav-next-mobile
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0"
              aria-label="Next problem"
            >
              →
            </button>
            <button
              type="button"
              data-cheat-toggle-mobile
              aria-expanded="${this.cheatSheetOpen}"
              title="Formula Cheat Sheet"
              class="btn-glass !py-1.5 !px-2.5 !text-xs shrink-0 ${
                this.cheatSheetOpen ? 'border-cyanGlow/50 bg-cyanGlow/15 text-cyan-200' : ''
              }"
            >
              📘
            </button>
          </div>

          <!-- Collapsible on Mobile / Always Visible on Desktop: Tier Filters + Problem Selector -->
          <div
            data-mobile-picker-drawer
            class="${this.mobilePickerOpen ? 'flex' : 'hidden'} md:flex flex-col gap-2.5 sm:gap-3.5 p-2.5 md:p-0 rounded-2xl md:rounded-none bg-slate-950/75 md:bg-transparent border border-white/10 md:border-0"
          >
            <!-- Tier Filters + Overall Progress -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div class="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-[#0E121C]/85 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" role="tablist" aria-label="Mastery tier filter">
                ${tierPillsHtml}
              </div>
              <div class="flex items-center gap-2.5">
                <div
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emeraldGlow/10 border border-emeraldGlow/30 text-xs font-mono text-emerald-200"
                  data-overall-solved
                >
                  <span class="w-2 h-2 rounded-full bg-emeraldGlow shadow-[0_0_8px_#34D399]"></span>
                  <span>Solved <strong class="text-white">${totalSolved}</strong> / ${totalProblems}</span>
                </div>
                <button
                  type="button"
                  data-cheat-toggle
                  aria-expanded="${this.cheatSheetOpen}"
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3 ${
                    this.cheatSheetOpen
                      ? 'border-cyanGlow/50 bg-cyanGlow/15 text-cyan-200'
                      : ''
                  }"
                >
                  <span>📘</span>
                  <span>Formula Cheat Sheet</span>
                </button>
              </div>
            </div>

            <!-- Problem Navigation Row -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-0.5">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-nav-prev
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3"
                  title="Previous problem"
                >
                  ← Prev
                </button>
                <div class="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Problem selector">
                  ${problemDotsHtml}
                </div>
                <button
                  type="button"
                  data-nav-next
                  class="hidden md:inline-flex btn-glass text-xs py-1.5 px-3"
                  title="Next problem"
                >
                  Next →
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <span class="chip-outer">${escapeHtml(problem.tierLabel)}</span>
                <span class="font-display text-sm sm:text-base font-semibold text-white">
                  ${globalIndex + 1}. ${escapeHtml(problem.title)}
                </span>
                ${
                  problemIsSolved
                    ? '<span class="status-live" data-problem-solved-badge>Mastered</span>'
                    : '<span class="status-planned" data-problem-solved-badge>In Progress</span>'
                }
              </div>
            </div>
          </div>

          <!-- Collapsible Formula Cheat Sheet Drawer -->
          <div
            data-cheat-drawer
            class="${this.cheatSheetOpen ? '' : 'hidden'} rounded-2xl p-3 sm:p-4 bg-slate-950/90 border border-cyanGlow/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-display text-xs sm:text-sm font-semibold text-cyan-200">Differentiation Formula Reference</span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span class="chip-outer">Cyan: Outer / u</span>
                <span class="chip-inner">Amber: Inner / v</span>
                <span class="chip-deriv">Emerald: Deriv</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[260px] md:max-h-none overflow-y-auto studio-scroll">
              ${cheatSheetCardsHtml}
            </div>
          </div>

          <!-- Optional Mechatronics Context Pill -->
          <div
            data-mechatronics-pill
            class="${this.mechatronicsLens ? '' : 'hidden'} rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 bg-amberGlow/10 border border-amberGlow/35 text-[11px] sm:text-sm text-amber-100 flex items-start gap-2"
          >
            <span class="shrink-0 mt-0.5 text-amber-300 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amberGlow/20 border border-amberGlow/40">
              ⚙ Mech
            </span>
            <span class="leading-snug sm:leading-relaxed" data-mechatronics-text>${renderInlineMathText(problem.mechatronicsContext)}</span>
          </div>

          <!-- Target Expression Card -->
          <div class="katex-card katex-hero flex-col gap-1 sm:gap-2">
            <div class="w-full flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span class="truncate">Differentiate w.r.t. x</span>
              <span class="text-cyan-300/90 shrink-0">${escapeHtml(problem.tierLabel)} • ${globalIndex + 1}/${totalProblems}</span>
            </div>
            <div class="w-full flex items-center justify-center py-0.5 sm:py-1 overflow-x-auto" data-target-expression></div>
          </div>
        </div>

        <!-- LIVE WORKING STEP LEDGER -->
        <div class="rounded-2xl p-2.5 sm:p-4 bg-slate-950/55 border border-white/[0.08] flex flex-col gap-1.5 sm:gap-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="w-2 h-2 rounded-full bg-emeraldGlow"></span>
              <h3 class="font-display text-[11px] sm:text-sm font-semibold uppercase tracking-wider text-slate-200">
                Working Step Ledger
              </h3>
              <span class="text-xs text-slate-400 hidden sm:inline">• Locked milestones stay pinned — no paper needed</span>
            </div>
            <span class="font-mono text-[11px] sm:text-xs text-emerald-300">
              ${this.completedSteps.length} / ${problem.steps.length} locked
            </span>
          </div>
          <div data-ledger-scroll class="flex flex-col gap-1.5 sm:gap-2 max-h-[104px] sm:max-h-none overflow-y-auto studio-scroll">
            ${ledgerRowsHtml}
          </div>
        </div>

        <!-- ACTIVE MICRO-STEP OR VERIFICATION CARD -->
        ${activeAreaHtml}
      </div>
    `;

    // Render KaTeX equations cleanly after injecting structure
    this._hydrateKatex(problem);
    this._bindEvents();

    // Auto-scroll ledger to the newest locked milestone on compact mobile screens
    const ledgerScroll = this.container.querySelector('[data-ledger-scroll]');
    if (ledgerScroll && this.completedSteps.length > 0) {
      ledgerScroll.scrollTop = ledgerScroll.scrollHeight;
    }

    if (this.isProblemCompleted) {
      this._initVerificationCanvas();
    }

    // Reset fresh animation index so subsequent micro-updates don't re-animate old rows
    this.newlyLockedIndex = -1;
  }

  _buildActiveStepHtml(problem) {
    const step = problem.steps[this.currentStepIndex];
    if (!step) return '';

    const totalSteps = problem.steps.length;
    const stepNum = this.currentStepIndex + 1;
    const pct = Math.round(((stepNum - 1) / totalSteps) * 100);

    const segmentsHtml = problem.steps
      .map((_, i) => {
        const done = i < this.currentStepIndex;
        const active = i === this.currentStepIndex;
        return `
          <div class="h-1.5 flex-1 rounded-full transition-all ${
            done
              ? 'bg-emeraldGlow shadow-[0_0_8px_rgba(52,211,153,0.55)]'
              : active
                ? 'bg-cyanGlow shadow-[0_0_10px_rgba(34,211,238,0.65)]'
                : 'bg-white/10'
          }"></div>
        `;
      })
      .join('');

    const optionsHtml = step.options
      .map((opt, idx) => {
        const wasWrong = this.wrongOptionIds.has(opt.id);
        return `
          <button
            type="button"
            data-option-id="${escapeHtml(opt.id)}"
            class="math-tile ${wasWrong ? 'is-wrong' : ''}"
          >
            <span class="tile-key">${idx + 1}</span>
            <div class="flex-1 min-w-0 overflow-x-auto py-0.5 text-sm sm:text-base" data-option-latex="${escapeHtml(opt.id)}"></div>
          </button>
        `;
      })
      .join('');

    return `
      <div class="rounded-2xl p-3 sm:p-5 bg-slate-900/75 border border-cyanGlow/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] flex flex-col gap-2.5 sm:gap-4 view-enter">
        <!-- Step Progress Bar & Header -->
        <div class="flex flex-col gap-1.5 sm:gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="font-mono text-[11px] sm:text-xs font-semibold text-cyan-300">Step ${stepNum}/${totalSteps}</span>
              <span class="chip-outer">${escapeHtml(step.badge)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="hidden sm:inline font-mono text-[11px] text-slate-500">Keys 1–4 select • H hint</span>
              <button
                type="button"
                data-hint-btn
                aria-expanded="${this.hintVisible}"
                class="btn-glass text-[11px] sm:text-xs py-1 px-2 sm:px-2.5 text-amber-200 border-amberGlow/30 hover:border-amberGlow/60"
              >
                <span>💡</span>
                <span>Hint</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1.5" aria-label="Step progress ${pct}%">
            ${segmentsHtml}
          </div>
        </div>

        <!-- Prompt & Color-Coded Focus Strip -->
        <div class="flex flex-col gap-1.5 sm:gap-2.5">
          <p class="text-xs sm:text-base text-slate-100 font-medium leading-snug sm:leading-relaxed m-0">
            ${renderInlineMathText(step.prompt)}
          </p>
          <div class="katex-card flex items-center justify-center py-2 px-3 sm:py-3 sm:px-4 border-cyanGlow/20 bg-slate-950/75">
            <div class="overflow-x-auto max-w-full text-sm sm:text-lg" data-step-highlight></div>
          </div>
        </div>

        <!-- Optional Hint Callout -->
        <div
          data-hint-box
          class="${this.hintVisible ? '' : 'hidden'} rounded-xl px-3 py-2 sm:px-4 sm:py-3 bg-amberGlow/10 border border-amberGlow/35 text-xs sm:text-sm text-amber-100 flex items-start gap-2"
        >
          <span class="text-amber-300 shrink-0 mt-0.5">💡</span>
          <div class="leading-snug sm:leading-relaxed">
            <strong class="font-display text-amber-200 mr-1">Hint:</strong>
            ${renderInlineMathText(step.hint)}
          </div>
        </div>

        <!-- Tactile KaTeX Choice Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3" role="group" aria-label="Step answer choices">
          ${optionsHtml}
        </div>

        <!-- Misconception Feedback Banner -->
        <div
          data-misconception-banner
          class="${this.activeMisconception ? '' : 'hidden'} rounded-xl px-3 py-2 sm:px-4 sm:py-3 bg-rose-500/15 border border-rose-400/40 text-xs sm:text-sm text-rose-100 flex items-start gap-2"
          role="alert"
        >
          <span class="shrink-0 mt-0.5 text-rose-300 font-bold">✕</span>
          <div class="leading-snug sm:leading-relaxed">
            <strong class="font-display text-rose-200 mr-1">Check that step:</strong>
            <span data-misconception-text>${this.activeMisconception ? renderInlineMathText(this.activeMisconception) : ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  _buildVerificationCardHtml(problem) {
    return `
      <div class="rounded-2xl p-3 sm:p-5 bg-gradient-to-b from-emeraldGlow/[0.11] to-slate-950/85 border border-emeraldGlow/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-3 sm:gap-4 snap-in">
        <!-- Solved Banner -->
        <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div class="flex items-center gap-2 sm:gap-2.5">
            <span class="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emeraldGlow/20 border border-emeraldGlow/55 text-emerald-300 font-bold text-xs sm:text-sm shadow-[0_0_16px_rgba(52,211,153,0.45)]">
              ✓
            </span>
            <div>
              <h3 class="font-display text-sm sm:text-lg font-bold text-emerald-200 leading-tight m-0">
                Derivative Verified Numerically
              </h3>
              <p class="hidden sm:block text-xs text-slate-300 m-0">
                ${renderInlineMathText("Hover or drag across the plot to compare your solved $f'(x)$ against the curve's true tangent slope.")}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" data-solve-again class="btn-glass text-xs sm:text-sm">
              ↺ Again
            </button>
            <button type="button" data-next-problem class="btn-glow-cyan text-xs sm:text-sm">
              Next →
            </button>
          </div>
        </div>

        <!-- Final Solved Formula Card -->
        <div class="katex-card border-emeraldGlow/35 bg-slate-950/80 flex items-center justify-center py-2 sm:py-3">
          <div class="overflow-x-auto max-w-full text-base sm:text-xl" data-final-answer></div>
        </div>

        <!-- Dual-Curve Interactive Verification Canvas -->
        <div class="rounded-xl overflow-hidden border border-white/10 bg-[#080A0F] relative">
          <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 border-b border-white/[0.07] bg-slate-950/75 text-[10px] sm:text-[11px] font-mono">
            <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span class="inline-flex items-center gap-1 text-cyan-300">
                <span class="w-2.5 h-0.5 rounded bg-cyanGlow inline-block"></span>
                f(x)
              </span>
              <span class="inline-flex items-center gap-1 text-emerald-300">
                <span class="w-2.5 h-0.5 rounded bg-emeraldGlow inline-block"></span>
                f'(x)
              </span>
              <span class="inline-flex items-center gap-1 text-amber-300">
                <span class="w-2.5 h-0.5 rounded bg-amberGlow inline-block"></span>
                tangent
              </span>
            </div>
            <span class="text-slate-400">[${problem.domain[0]}, ${problem.domain[1]}]</span>
          </div>

          <div class="relative w-full h-[175px] sm:h-[260px] select-none touch-none">
            <canvas
              data-verify-canvas
              class="block w-full h-full cursor-crosshair"
              aria-label="Interactive dual curve graph comparing f(x) and f'(x)"
            ></canvas>
          </div>

          <!-- Live Numerical Verification Telemetry Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-t border-white/[0.08] bg-slate-950/90 font-mono text-xs">
            <div class="rounded-lg px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06]">
              <div class="text-[10px] uppercase tracking-wider text-slate-400">Probe x</div>
              <div class="text-slate-100 font-semibold mt-0.5" data-verify-x>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 bg-cyanGlow/[0.06] border border-cyanGlow/20">
              <div class="text-[10px] uppercase tracking-wider text-cyan-300/80">f(x) Height</div>
              <div class="text-cyan-200 font-semibold mt-0.5" data-verify-fx>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 bg-emeraldGlow/[0.08] border border-emeraldGlow/25">
              <div class="text-[10px] uppercase tracking-wider text-emerald-300/80">Exact f'(x)</div>
              <div class="text-emerald-200 font-semibold mt-0.5" data-verify-exact>—</div>
            </div>
            <div class="rounded-lg px-2.5 py-1.5 bg-violetGlow/[0.08] border border-violetGlow/25">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] uppercase tracking-wider text-violet-300/80">True Slope</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-emeraldGlow/20 text-emerald-300 font-semibold" data-verify-match>MATCH ✓</span>
              </div>
              <div class="text-violet-200 font-semibold mt-0.5" data-verify-numeric>—</div>
            </div>
          </div>
        </div>

        <div class="text-center text-[11px] font-mono text-slate-400">
          Press <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-slate-200">Enter</kbd> to advance to the next problem
        </div>
      </div>
    `;
  }

  _hydrateKatex(problem) {
    if (!this.container) return;

    const targetEl = this.container.querySelector('[data-target-expression]');
    if (targetEl) {
      renderKatex(targetEl, problem.expressionLatex, true);
    }

    // Cheat sheet formulas
    CHEAT_SHEET_RULES.forEach((rule, idx) => {
      const el = this.container.querySelector(`[data-cheat-formula="${idx}"]`);
      if (el) renderKatex(el, rule.latex, false);
    });

    // Locked ledger rows
    this.completedSteps.forEach((st, idx) => {
      const el = this.container.querySelector(`[data-ledger-latex="${idx}"]`);
      if (el) renderKatex(el, st.lockedResultLatex, false);
    });

    if (this.isProblemCompleted) {
      const finalEl = this.container.querySelector('[data-final-answer]');
      if (finalEl) renderKatex(finalEl, problem.finalAnswerLatex, true);
    } else {
      const step = problem.steps[this.currentStepIndex];
      if (step) {
        const hlEl = this.container.querySelector('[data-step-highlight]');
        if (hlEl) renderKatex(hlEl, step.highlightLatex, false);

        step.options.forEach((opt) => {
          const optEl = this.container.querySelector(
            `[data-option-latex="${CSS.escape(opt.id)}"]`
          );
          if (optEl) renderKatex(optEl, opt.latex, false);
        });
      }
    }
  }

  _bindEvents() {
    if (!this.container) return;

    this.container.querySelectorAll('[data-tier-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._setTier(btn.getAttribute('data-tier-id'));
      });
    });

    this.container.querySelectorAll('[data-problem-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-problem-id');
        if (id && id !== this.activeProblemId) {
          sound?.playTick?.();
          this.mobilePickerOpen = false;
          this.selectProblem(id);
        }
      });
    });

    this.container.querySelector('[data-mobile-picker-toggle]')?.addEventListener('click', () => {
      this._toggleMobilePicker();
    });

    this.container.querySelectorAll('[data-nav-prev], [data-nav-prev-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._navigateRelative(-1);
      });
    });
    this.container.querySelectorAll('[data-nav-next], [data-nav-next-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._navigateRelative(1);
      });
    });

    this.container.querySelectorAll('[data-cheat-toggle], [data-cheat-toggle-mobile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._toggleCheatSheet();
      });
    });

    this.container.querySelector('[data-hint-btn]')?.addEventListener('click', () => {
      this._toggleHint();
    });

    this.container.querySelectorAll('[data-option-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._handleOptionSelect(btn.getAttribute('data-option-id'));
      });
    });

    this.container.querySelector('[data-solve-again]')?.addEventListener('click', () => {
      sound?.playTick?.();
      this._resetActiveProblemState();
      this._render();
    });

    this.container.querySelector('[data-next-problem]')?.addEventListener('click', () => {
      this._navigateRelative(1);
    });
  }

  _updateMechatronicsPill() {
    if (!this.container) return;
    const pill = this.container.querySelector('[data-mechatronics-pill]');
    if (pill) {
      pill.classList.toggle('hidden', !this.mechatronicsLens);
    }
  }

  _updateSolvedBadges() {
    if (!this.container) return;
    const solvedSet = this._getSolvedSet();
    const totalSolved = DERIVATIVE_PROBLEMS.filter((p) => solvedSet.has(p.id)).length;

    const overallEl = this.container.querySelector('[data-overall-solved] strong');
    if (overallEl) {
      overallEl.textContent = String(totalSolved);
    }

    SOLVER_TIERS.forEach((tier) => {
      const list =
        tier.id === 'all'
          ? DERIVATIVE_PROBLEMS
          : DERIVATIVE_PROBLEMS.filter((p) => p.tier === tier.id);
      const count = list.filter((p) => solvedSet.has(p.id)).length;
      const badge = this.container.querySelector(
        `[data-tier-count="${CSS.escape(tier.id)}"]`
      );
      if (badge) badge.textContent = `${count}/${list.length}`;
    });
  }

  /* ========================================================================
     High-DPI Interactive Dual-Curve Verification Canvas
     ======================================================================== */

  _initVerificationCanvas() {
    const canvas = this.container?.querySelector('[data-verify-canvas]');
    if (!canvas) return;
    this.verifyCanvas = canvas;

    canvas.addEventListener('pointerdown', this._boundCanvasPointerDown);
    canvas.addEventListener('pointermove', this._boundCanvasPointerMove);
    canvas.addEventListener('pointerup', this._boundCanvasPointerUp);
    canvas.addEventListener('pointercancel', this._boundCanvasPointerUp);
    canvas.addEventListener('pointerleave', this._boundCanvasPointerLeave);

    const problem = this._getActiveProblem();
    if (this.verifyCursorX == null) {
      const [xMin, xMax] = problem.domain;
      this.verifyCursorX = xMin + (xMax - xMin) * 0.56;
    }

    this._drawVerificationCanvas();
  }

  _detachCanvasListeners() {
    if (!this.verifyCanvas) return;
    this.verifyCanvas.removeEventListener('pointerdown', this._boundCanvasPointerDown);
    this.verifyCanvas.removeEventListener('pointermove', this._boundCanvasPointerMove);
    this.verifyCanvas.removeEventListener('pointerup', this._boundCanvasPointerUp);
    this.verifyCanvas.removeEventListener('pointercancel', this._boundCanvasPointerUp);
    this.verifyCanvas.removeEventListener('pointerleave', this._boundCanvasPointerLeave);
    this.verifyCanvas = null;
  }

  _updateCursorFromEvent(e) {
    if (!this.verifyCanvas || !this.verifyPlotGeom) return;
    const rect = this.verifyCanvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const { padL, plotW, xMin, xMax } = this.verifyPlotGeom;
    const t = Math.max(0, Math.min(1, (cssX - padL) / plotW));
    const margin = (xMax - xMin) * 0.015;
    this.verifyCursorX = Math.max(
      xMin + margin,
      Math.min(xMax - margin, xMin + t * (xMax - xMin))
    );
    this._drawVerificationCanvas();
  }

  _handleCanvasPointerDown(e) {
    this.isDraggingVerify = true;
    try {
      this.verifyCanvas?.setPointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
    this._updateCursorFromEvent(e);
  }

  _handleCanvasPointerMove(e) {
    // Allow effortless hover scrubbing on desktop AND touch drag on mobile
    if (e.pointerType === 'mouse' || this.isDraggingVerify) {
      this._updateCursorFromEvent(e);
    }
  }

  _handleCanvasPointerUp(e) {
    this.isDraggingVerify = false;
    try {
      this.verifyCanvas?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
  }

  _handleCanvasPointerLeave() {
    this.isDraggingVerify = false;
  }

  _drawVerificationCanvas() {
    const canvas = this.verifyCanvas;
    if (!canvas || !canvas.isConnected) return;

    const problem = this._getActiveProblem();
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background studio fill
    ctx.fillStyle = '#080B11';
    ctx.fillRect(0, 0, width, height);

    const [xMin, xMax] = problem.domain;
    const samples = 220;
    const xs = [];
    const fVals = [];
    const dfVals = [];

    let fMin = Infinity;
    let fMax = -Infinity;
    let dfMin = Infinity;
    let dfMax = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = problem.verifyFn(x);
      const dy = problem.verifyDerivFn(x);
      xs.push(x);
      fVals.push(y);
      dfVals.push(dy);
      if (Number.isFinite(y)) {
        if (y < fMin) fMin = y;
        if (y > fMax) fMax = y;
      }
      if (Number.isFinite(dy)) {
        if (dy < dfMin) dfMin = dy;
        if (dy > dfMax) dfMax = dy;
      }
    }

    const fSpan = Math.max(1e-3, fMax - fMin);
    const dfSpan = Math.max(1e-3, dfMax - dfMin);
    const scaleRatio = Math.max(fSpan / dfSpan, dfSpan / fSpan);
    const useDualAxis = scaleRatio > 2.6;

    let fyMin;
    let fyMax;
    let dfyMin;
    let dfyMax;

    if (useDualAxis) {
      fyMin = fMin - fSpan * 0.14;
      fyMax = fMax + fSpan * 0.14;
      dfyMin = dfMin - dfSpan * 0.14;
      dfyMax = dfMax + dfSpan * 0.14;
    } else {
      const combMin = Math.min(fMin, dfMin);
      const combMax = Math.max(fMax, dfMax);
      const combSpan = Math.max(1e-3, combMax - combMin);
      fyMin = combMin - combSpan * 0.14;
      fyMax = combMax + combSpan * 0.14;
      dfyMin = fyMin;
      dfyMax = fyMax;
    }

    const padL = 52;
    const padR = useDualAxis ? 54 : 22;
    const padT = 18;
    const padB = 30;
    const plotW = Math.max(40, width - padL - padR);
    const plotH = Math.max(40, height - padT - padB);

    this.verifyPlotGeom = { padL, padR, padT, padB, plotW, plotH, xMin, xMax };

    const mapX = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const mapYf = (y) => padT + (1 - (y - fyMin) / (fyMax - fyMin)) * plotH;
    const mapYdf = (y) => padT + (1 - (y - dfyMin) / (dfyMax - dfyMin)) * plotH;

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.lineWidth = 1;
    const gridRows = 4;
    const gridCols = 5;

    ctx.font = '10px "JetBrains Mono", monospace';
    for (let r = 0; r <= gridRows; r++) {
      const yPx = padT + (r / gridRows) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPx);
      ctx.lineTo(padL + plotW, yPx);
      ctx.stroke();

      const fTick = fyMax - (r / gridRows) * (fyMax - fyMin);
      ctx.fillStyle = useDualAxis ? 'rgba(103, 232, 249, 0.8)' : 'rgba(148, 163, 184, 0.78)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatAxisTick(fTick), padL - 7, yPx);

      if (useDualAxis) {
        const dfTick = dfyMax - (r / gridRows) * (dfyMax - dfyMin);
        ctx.fillStyle = 'rgba(110, 231, 183, 0.8)';
        ctx.textAlign = 'left';
        ctx.fillText(formatAxisTick(dfTick), padL + plotW + 7, yPx);
      }
    }

    for (let c = 0; c <= gridCols; c++) {
      const xPx = padL + (c / gridCols) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPx, padT);
      ctx.lineTo(xPx, padT + plotH);
      ctx.stroke();

      const xTick = xMin + (c / gridCols) * (xMax - xMin);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(formatAxisTick(xTick), xPx, padT + plotH + 8);
    }

    // Emphasized x=0 and y=0 axes when in view
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.1;
    if (xMin < 0 && xMax > 0) {
      const x0 = mapX(0);
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, padT + plotH);
      ctx.stroke();
    }
    if (fyMin < 0 && fyMax > 0) {
      const y0 = mapYf(0);
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();
    }
    ctx.restore();

    // Clip to plot box for curves and tangent line
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Draw f'(x) in luminous Emerald
    ctx.save();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2.25;
    ctx.shadowColor = 'rgba(52, 211, 153, 0.55)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= samples; i++) {
      if (!Number.isFinite(dfVals[i])) continue;
      const px = mapX(xs[i]);
      const py = mapYdf(dfVals[i]);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw f(x) in luminous Cyan
    ctx.save();
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
    ctx.shadowBlur = 11;
    ctx.beginPath();
    started = false;
    for (let i = 0; i <= samples; i++) {
      if (!Number.isFinite(fVals[i])) continue;
      const px = mapX(xs[i]);
      const py = mapYf(fVals[i]);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Interactive cursor, tangent segment on f(x), and markers
    const cx = this.verifyCursorX ?? xMin + (xMax - xMin) * 0.56;
    const fxVal = problem.verifyFn(cx);
    const exactSlope = problem.verifyDerivFn(cx);
    const numericSlope = centralDiff(problem.verifyFn, cx, 1e-5);

    const cxPx = mapX(cx);
    const fyPx = mapYf(fxVal);
    const dfyPx = mapYdf(exactSlope);

    // Vertical glowing scan line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cxPx, padT);
    ctx.lineTo(cxPx, padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Exact screen-space tangent segment kissing f(x) at (cxPx, fyPx)
    if (Number.isFinite(fxVal) && Number.isFinite(exactSlope)) {
      const dPxDx = plotW / (xMax - xMin);
      const dPyDx = (-exactSlope * plotH) / (fyMax - fyMin);
      const mag = Math.hypot(dPxDx, dPyDx) || 1;
      const halfLen = 40;
      const ux = (dPxDx / mag) * halfLen;
      const uy = (dPyDx / mag) * halfLen;

      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cxPx - ux, fyPx - uy);
      ctx.lineTo(cxPx + ux, fyPx + uy);
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on f'(x)
    if (Number.isFinite(exactSlope)) {
      ctx.save();
      ctx.fillStyle = '#34D399';
      ctx.shadowColor = 'rgba(52, 211, 153, 0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, dfyPx, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#080B11';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Glowing point on f(x)
    if (Number.isFinite(fxVal)) {
      ctx.save();
      ctx.fillStyle = '#22D3EE';
      ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxPx, fyPx, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end clip

    // Dual-axis hint tag if dual scaling is active
    if (useDualAxis) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('Dual Y-axis: Cyan f(x) left · Emerald f\'(x) right', padL + plotW - 6, padT + 4);
    }

    ctx.restore();

    // Update live numerical verification telemetry readout
    this._updateVerificationReadout(cx, fxVal, exactSlope, numericSlope);
  }

  _updateVerificationReadout(x, fxVal, exactSlope, numericSlope) {
    if (!this.container) return;
    const xEl = this.container.querySelector('[data-verify-x]');
    const fxEl = this.container.querySelector('[data-verify-fx]');
    const exactEl = this.container.querySelector('[data-verify-exact]');
    const numEl = this.container.querySelector('[data-verify-numeric]');
    const matchEl = this.container.querySelector('[data-verify-match]');

    if (xEl) xEl.textContent = formatNum(x, 3);
    if (fxEl) fxEl.textContent = formatNum(fxVal, 4);
    if (exactEl) exactEl.textContent = formatNum(exactSlope, 4);
    if (numEl) numEl.textContent = formatNum(numericSlope, 4);

    if (matchEl && Number.isFinite(exactSlope) && Number.isFinite(numericSlope)) {
      const denom = Math.max(1, Math.abs(exactSlope));
      const relErr = Math.abs(exactSlope - numericSlope) / denom;
      matchEl.textContent = relErr < 1e-4 ? 'MATCH ✓' : `Δ ${relErr.toExponential(1)}`;
    }
  }
}
