/**
 * EIGENLAB — Shared Physical AI Frontier Lesson Shell
 * Reusable 60 FPS split-pane interactive lab framework with:
 * - Dead-front viewport chrome + live Telemetry HUD + Break-the-System fault injector
 * - LinkedEquationBar directly beneath the interactive canvas
 * - 6-step Brilliant-style Progressive Micro-Step Drawer with persisted Intuition Check
 */

import { LinkedEquationBar } from './linked-equation.js';
import { sound, renderInlineMathText } from '../store.js';
import {
  getDagNode,
  getDagTrack,
  getDirectUnlocks,
} from '../data/dag-curriculum.js';

export const FRONTIER_PROGRESS_KEY = 'eigenlab_frontier_done_v1';

const STYLE_ELEMENT_ID = 'eigenlab-frontier-shell-styles';

const PHOSPHOR = Object.freeze({
  cyan: { hex: '#00E5FF', rgb: '0, 229, 255', soft: '#80F2FF' },
  emerald: { hex: '#00E676', rgb: '0, 230, 118', soft: '#86F7BC' },
  amber: { hex: '#FFB300', rgb: '255, 179, 0', soft: '#FFD875' },
  crimson: { hex: '#FF1744', rgb: '255, 23, 68', soft: '#FF8096' },
  violet: { hex: '#A78BFA', rgb: '167, 139, 250', soft: '#D4C4FD' },
});

const STATUS_PRESETS = Object.freeze({
  safe: {
    label: 'SAFE INVARIANT',
    hex: '#00E676',
    rgb: '0, 230, 118',
    text: '#86F7BC',
  },
  warning: {
    label: 'WARNING',
    hex: '#FFB300',
    rgb: '255, 179, 0',
    text: '#FFD875',
  },
  fault: {
    label: 'FAULT ACTIVE',
    hex: '#FF1744',
    rgb: '255, 23, 68',
    text: '#FF8A9E',
  },
});

const STEP_META = Object.freeze([
  { index: 0, key: 'concept', short: '1. Concept', title: 'Visual Intuition' },
  { index: 1, key: 'explore', short: '2. Explore', title: 'Live Controls' },
  { index: 2, key: 'linkedMath', short: '3. Math', title: 'Linked Math' },
  { index: 3, key: 'breakSystem', short: '4. Break', title: 'Break the System' },
  { index: 4, key: 'intuitionCheck', short: '5. Check', title: 'Intuition Check' },
  { index: 5, key: 'frontierBridge', short: '6. Bridge', title: 'Frontier Bridge' },
]);

export function getFrontierCompletedIds() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(FRONTIER_PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === 'string' && id.length > 0))];
  } catch {
    return [];
  }
}

export function markFrontierCompleted(nodeId) {
  if (typeof nodeId !== 'string' || !nodeId) return getFrontierCompletedIds();
  const current = getFrontierCompletedIds();
  if (!current.includes(nodeId)) {
    current.push(nodeId);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(FRONTIER_PROGRESS_KEY, JSON.stringify(current));
      }
    } catch {
      // Ignore private-mode or quota errors
    }
  }
  return current;
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRichText(text) {
  if (text == null) return '';
  return renderInlineMathText(String(text));
}

function normalizeStatusLevel(status) {
  if (!status) return { level: 'safe', label: STATUS_PRESETS.safe.label };
  if (typeof status === 'object') {
    const rawLevel = String(status.level || status.state || status.type || 'safe').toLowerCase();
    const level =
      rawLevel === 'fault' || rawLevel === 'danger' || rawLevel === 'critical' || rawLevel === 'error'
        ? 'fault'
        : rawLevel === 'warning' || rawLevel === 'warn' || rawLevel === 'caution'
          ? 'warning'
          : 'safe';
    return {
      level,
      label: status.label ? String(status.label) : STATUS_PRESETS[level].label,
    };
  }
  const s = String(status).toLowerCase();
  if (s === 'fault' || s === 'danger' || s === 'critical' || s === 'error' || s === 'broken') {
    return { level: 'fault', label: STATUS_PRESETS.fault.label };
  }
  if (s === 'warning' || s === 'warn' || s === 'caution') {
    return { level: 'warning', label: STATUS_PRESETS.warning.label };
  }
  if (s === 'safe' || s === 'ok' || s === 'nominal' || s === 'healthy') {
    return { level: 'safe', label: STATUS_PRESETS.safe.label };
  }
  return { level: 'safe', label: String(status).toUpperCase() };
}

function formatTelemetryValue(raw, def) {
  if (raw == null) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return raw > 0 ? '+∞' : raw < 0 ? '-∞' : 'NaN';
    if (def && typeof def.format === 'function') {
      try {
        return String(def.format(raw));
      } catch {
        // Fallback below
      }
    }
    if (def && Number.isInteger(def.decimals)) {
      return raw.toFixed(def.decimals);
    }
    const abs = Math.abs(raw);
    if (abs === 0) return '0.00';
    if (abs >= 1000) return raw.toFixed(0);
    if (abs >= 100) return raw.toFixed(1);
    return raw.toFixed(2);
  }
  return String(raw);
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    @keyframes elCrimsonPulse {
      0%, 100% {
        box-shadow: 0 0 0 1px rgba(255, 23, 68, 0.78), 0 0 22px -2px rgba(255, 23, 68, 0.75);
      }
      50% {
        box-shadow: 0 0 0 2px rgba(255, 23, 68, 0.98), 0 0 34px 2px rgba(255, 23, 68, 0.92);
      }
    }
    @keyframes elStatusPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.85); }
    }

    .el-shell {
      width: 100%;
      max-width: 1480px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #F3F6FC;
    }

    .el-shell-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .el-shell-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }

    @media (min-width: 1024px) {
      .el-shell-grid {
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 16px;
      }
    }

    .el-viewport-col {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .el-viewport-frame {
      background: #1C1F26;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 22px 50px -20px rgba(0, 0, 0, 0.8);
      transition: border-color 0.22s ease, box-shadow 0.22s ease;
    }

    .el-viewport-frame[data-broken="true"] {
      border-color: rgba(255, 23, 68, 0.65);
      box-shadow: 0 0 0 1px rgba(255, 23, 68, 0.35), 0 18px 46px -14px rgba(255, 23, 68, 0.38);
    }

    .el-chrome-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 11px 14px;
      background: linear-gradient(180deg, rgba(28, 31, 38, 0.96) 0%, rgba(20, 23, 30, 0.98) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.09);
    }

    .el-chrome-left {
      display: flex;
      align-items: center;
      gap: 9px;
      flex-wrap: wrap;
      min-width: 0;
      flex: 1;
    }

    .el-chrome-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .el-id-badge {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 4px 8px;
      border-radius: 7px;
      background: rgba(0, 229, 255, 0.14);
      border: 1px solid rgba(0, 229, 255, 0.42);
      color: #80F2FF;
      flex-shrink: 0;
    }

    .el-tier-badge {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      color: #CBD5E1;
      white-space: nowrap;
    }

    .el-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      border: 1px solid rgba(0, 230, 118, 0.42);
      background: rgba(0, 230, 118, 0.12);
      color: #86F7BC;
      transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    }

    .el-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background: #00E676;
      box-shadow: 0 0 8px #00E676;
      animation: elStatusPulse 2s ease-in-out infinite;
    }

    .el-break-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 10px;
      border: 1px solid rgba(255, 179, 0, 0.48);
      background: linear-gradient(180deg, rgba(255, 179, 0, 0.2) 0%, rgba(255, 179, 0, 0.09) 100%);
      color: #FFE082;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.01em;
      cursor: pointer;
      white-space: nowrap;
      transition: transform 0.16s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .el-break-btn:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 179, 0, 0.85);
      box-shadow: 0 0 18px -4px rgba(255, 179, 0, 0.55);
    }

    .el-break-btn[data-active="true"] {
      border-color: rgba(255, 23, 68, 0.92);
      background: linear-gradient(180deg, rgba(255, 23, 68, 0.36) 0%, rgba(255, 23, 68, 0.18) 100%);
      color: #FFE4EA;
      animation: elCrimsonPulse 1.6s ease-in-out infinite;
    }

    .el-reset-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 11px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      color: #CBD5E1;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }

    .el-reset-btn:hover {
      background: rgba(255, 255, 255, 0.11);
      border-color: rgba(255, 255, 255, 0.24);
      color: #FFFFFF;
    }

    .el-telemetry-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      padding: 9px 14px;
      background: rgba(12, 14, 20, 0.96);
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }

    .el-metric-badge {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 10px;
      border-radius: 10px;
      background: rgba(28, 31, 38, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-width: 0;
    }

    .el-metric-label {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #8491A9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .el-metric-val-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
    }

    .el-metric-val {
      font-size: 14px;
      font-weight: 700;
      color: var(--m-color, #00E5FF);
      line-height: 1.15;
    }

    .el-metric-unit {
      font-size: 10px;
      color: #8491A9;
    }

    .el-canvas-stage {
      position: relative;
      width: 100%;
      min-height: 330px;
      height: 52vh;
      max-height: 560px;
      background: #0A0C10;
      overflow: hidden;
    }

    @media (min-width: 1024px) {
      .el-canvas-stage {
        min-height: 440px;
        height: 56vh;
        max-height: 600px;
      }
    }

    .el-canvas-host {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .el-fault-overlay {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(34, 8, 16, 0.94);
      border-bottom: 1px solid rgba(255, 23, 68, 0.55);
      color: #FFD2DA;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .el-viewport-frame[data-broken="true"] .el-fault-overlay {
      display: flex;
    }

    /* Right Drawer */
    .el-drawer {
      background: #1C1F26;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 20px 44px -18px rgba(0, 0, 0, 0.75);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .el-step-strip {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
      padding: 10px 10px 8px;
      background: rgba(13, 16, 22, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .el-step-dot-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 2px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.03);
      color: #8895AE;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 9.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.16s ease;
    }

    .el-step-dot-btn:hover {
      color: #E2E8F0;
      background: rgba(255, 255, 255, 0.07);
    }

    .el-step-dot-btn[data-active="true"] {
      color: #80F2FF;
      background: rgba(0, 229, 255, 0.14);
      border-color: rgba(0, 229, 255, 0.48);
      box-shadow: 0 0 14px -4px rgba(0, 229, 255, 0.45);
    }

    .el-step-dot-btn[data-done="true"]:not([data-active="true"]) {
      color: #86F7BC;
      border-color: rgba(0, 230, 118, 0.28);
      background: rgba(0, 230, 118, 0.08);
    }

    .el-step-pip {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: currentColor;
      opacity: 0.85;
    }

    .el-drawer-body {
      padding: 15px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 290px;
    }

    @media (min-width: 1024px) {
      .el-drawer-body {
        min-height: 460px;
        max-height: calc(56vh + 165px);
        overflow-y: auto;
      }
    }

    .el-step-pane {
      display: none;
      flex-direction: column;
      gap: 12px;
    }

    .el-step-pane[data-visible="true"] {
      display: flex;
    }

    .el-drawer-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 11px 14px;
      background: rgba(13, 16, 22, 0.85);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .el-control-card {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(10, 12, 16, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .el-quiz-opt {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      border-radius: 11px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(10, 12, 16, 0.65);
      color: #E2E8F0;
      font-size: 13px;
      line-height: 1.4;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 9px;
      transition: all 0.16s ease;
    }

    .el-quiz-opt:hover {
      border-color: rgba(0, 229, 255, 0.45);
      background: rgba(0, 229, 255, 0.08);
    }

    .el-quiz-opt[data-state="correct"] {
      border-color: rgba(0, 230, 118, 0.82);
      background: rgba(0, 230, 118, 0.14);
      color: #ECFDF5;
    }

    .el-quiz-opt[data-state="wrong"] {
      border-color: rgba(255, 23, 68, 0.78);
      background: rgba(255, 23, 68, 0.14);
      color: #FFE4EA;
    }

    .el-nav-card {
      width: 100%;
      text-align: left;
      padding: 9px 11px;
      border-radius: 11px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      background: rgba(10, 12, 16, 0.7);
      color: #E2E8F0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      transition: transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    }

    .el-nav-card:hover {
      transform: translateY(-1px);
      border-color: rgba(0, 229, 255, 0.5);
      background: rgba(0, 229, 255, 0.08);
    }

    @media (max-width: 640px) {
      .el-chrome-bar {
        padding: 10px 11px;
      }
      .el-telemetry-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 8px 10px;
      }
      .el-canvas-stage {
        min-height: 290px;
        height: 44vh;
      }
      .el-break-btn {
        padding: 6px 10px;
        font-size: 11.5px;
      }
      .el-drawer-body {
        padding: 13px 13px;
        min-height: 240px;
      }
    }
  `;
  document.head.appendChild(style);
}

function resolveStepContent(steps, key, index) {
  if (!steps) return {};
  if (Array.isArray(steps)) {
    const byKey = steps.find((s) => s && (s.id === key || s.key === key));
    if (byKey) return byKey;
    return steps[index] || {};
  }
  if (typeof steps === 'object') {
    return steps[key] || steps[index] || {};
  }
  return {};
}

export class FrontierLessonShell {
  constructor() {
    this._container = null;
    this._root = null;
    this._labModule = null;
    this._options = {};
    this._linkedEq = null;
    this._labCleanup = null;

    this._cleanups = [];
    this._telemetryRefs = new Map();
    this._controlRefs = new Map();
    this._controlValues = {};
    this._initialControlValues = {};

    this._controlListeners = new Set();
    this._breakListeners = new Set();
    this._hoverListeners = new Set();
    this._resetListeners = new Set();

    this._isBroken = false;
    this._hoveredVar = null;
    this._activeStep = 0;
    this._quizSolved = false;

    this._viewportFrameEl = null;
    this._statusPillEl = null;
    this._statusDotEl = null;
    this._statusTextEl = null;
    this._lastStatusKey = '';
    this._chromeBreakBtn = null;
    this._drawerBreakBtn = null;
    this._stepButtons = [];
    this._stepPanes = [];
    this._prevBtn = null;
    this._nextBtn = null;
    this._stepCounterEl = null;
  }

  /**
   * Mount a Frontier Physical AI lab module into the shell.
   * @param {HTMLElement} container
   * @param {object} labModule
   * @param {{ onBackToGraph?: () => void, onNavigateNode?: (nodeId: string) => void, onOpenStudio?: () => void, onCompleteNode?: (nodeId: string) => void }} [options]
   */
  mount(container, labModule, options = {}) {
    this.dispose();
    if (!container || !labModule) return this;

    ensureStyles();

    this._container = container;
    this._labModule = labModule;
    this._options = options || {};
    this._isBroken = false;
    this._hoveredVar = null;
    this._activeStep = 0;

    const completedIds = getFrontierCompletedIds();
    this._quizSolved = Boolean(labModule.nodeId && completedIds.includes(labModule.nodeId));

    // Seed initial control values
    const controls = Array.isArray(labModule.controls) ? labModule.controls : [];
    for (const ctrl of controls) {
      if (!ctrl || !ctrl.id) continue;
      const defVal =
        ctrl.value !== undefined
          ? ctrl.value
          : ctrl.defaultValue !== undefined
            ? ctrl.defaultValue
            : ctrl.type === 'toggle' || ctrl.type === 'boolean'
              ? false
              : ctrl.min !== undefined
                ? Number(ctrl.min)
                : 0;
      this._controlValues[ctrl.id] = defVal;
      this._initialControlValues[ctrl.id] = defVal;
    }

    const dagNode = labModule.nodeId ? getDagNode(labModule.nodeId) : null;
    const tierNum = labModule.tier || (dagNode ? dagNode.tier : 1);
    const tierLabel =
      tierNum === 2 || String(tierNum).toLowerCase().includes('2')
        ? 'TIER 2 PHYSICAL AI'
        : 'TIER 1 FOUNDATION';
    const badgeId = labModule.badge || labModule.nodeId || 'LAB';
    const title = labModule.title || (dagNode ? dagNode.title : 'Interactive Lab');
    const subtitle = labModule.subtitle || (dagNode ? dagNode.tagline : '');

    const root = document.createElement('section');
    root.className = 'el-shell';
    root.setAttribute('data-frontier-shell', labModule.nodeId || 'lab');

    // Optional compact top action bar (Back to Skill Graph / Open Studio)
    if (
      !this._options.hideTopBar &&
      (typeof this._options.onBackToGraph === 'function' ||
        typeof this._options.onOpenStudio === 'function')
    ) {
      const topBar = document.createElement('div');
      topBar.className = 'el-shell-topbar';

      const leftNav = document.createElement('div');
      leftNav.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';

      if (typeof this._options.onBackToGraph === 'function') {
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'el-reset-btn';
        backBtn.innerHTML = '<span>←</span><span>Skill Graph</span>';
        const onBack = () => {
          sound.playTick();
          this._options.onBackToGraph();
        };
        backBtn.addEventListener('click', onBack);
        this._cleanups.push(() => backBtn.removeEventListener('click', onBack));
        leftNav.appendChild(backBtn);
      }

      if (subtitle) {
        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-size:12.5px;color:#8D99B2;';
        subSpan.textContent = subtitle;
        leftNav.appendChild(subSpan);
      }

      topBar.appendChild(leftNav);

      if (typeof this._options.onOpenStudio === 'function') {
        const studioBtn = document.createElement('button');
        studioBtn.type = 'button';
        studioBtn.className = 'el-reset-btn';
        studioBtn.textContent = '3D Studio →';
        const onStudio = () => {
          sound.playTick();
          this._options.onOpenStudio();
        };
        studioBtn.addEventListener('click', onStudio);
        this._cleanups.push(() => studioBtn.removeEventListener('click', onStudio));
        topBar.appendChild(studioBtn);
      }

      root.appendChild(topBar);
    }

    // Main split-pane grid
    const grid = document.createElement('div');
    grid.className = 'el-shell-grid';

    // =========================================================================
    // LEFT COLUMN: Main Interactive Viewport (>= 66% on Desktop) + Linked Math
    // =========================================================================
    const viewportCol = document.createElement('div');
    viewportCol.className = 'el-viewport-col';

    const frame = document.createElement('div');
    frame.className = 'el-viewport-frame';
    frame.setAttribute('data-broken', 'false');
    this._viewportFrameEl = frame;

    // 1. Top Lab Chrome Bar
    const chrome = document.createElement('div');
    chrome.className = 'el-chrome-bar';

    const chromeLeft = document.createElement('div');
    chromeLeft.className = 'el-chrome-left';

    const idBadge = document.createElement('span');
    idBadge.className = 'el-id-badge';
    idBadge.textContent = badgeId;
    chromeLeft.appendChild(idBadge);

    const titleEl = document.createElement('h2');
    titleEl.style.cssText =
      "margin:0;font-family:'Space Grotesk',system-ui,sans-serif;font-size:15.5px;font-weight:700;color:#F8FAFC;line-height:1.2;";
    titleEl.textContent = title;
    chromeLeft.appendChild(titleEl);

    const tierBadge = document.createElement('span');
    tierBadge.className = 'el-tier-badge';
    tierBadge.textContent = tierLabel;
    if (tierNum === 2) {
      tierBadge.style.borderColor = 'rgba(167, 139, 250, 0.42)';
      tierBadge.style.background = 'rgba(167, 139, 250, 0.14)';
      tierBadge.style.color = '#D4C4FD';
    }
    chromeLeft.appendChild(tierBadge);

    const statusPill = document.createElement('span');
    statusPill.className = 'el-status-pill';
    statusPill.setAttribute('data-status-pill', 'safe');
    const statusDot = document.createElement('span');
    statusDot.className = 'el-status-dot';
    const statusText = document.createElement('span');
    statusText.textContent = STATUS_PRESETS.safe.label;
    statusPill.appendChild(statusDot);
    statusPill.appendChild(statusText);
    chromeLeft.appendChild(statusPill);

    this._statusPillEl = statusPill;
    this._statusDotEl = statusDot;
    this._statusTextEl = statusText;
    this._lastStatusKey = 'safe:' + STATUS_PRESETS.safe.label;

    const chromeRight = document.createElement('div');
    chromeRight.className = 'el-chrome-right';

    const breakBtn = document.createElement('button');
    breakBtn.type = 'button';
    breakBtn.className = 'el-break-btn';
    breakBtn.setAttribute('data-break-toggle', 'true');
    breakBtn.setAttribute('data-active', 'false');
    breakBtn.setAttribute('aria-pressed', 'false');
    breakBtn.textContent =
      (labModule.breakMode && labModule.breakMode.buttonLabel) || '⚡ Break the System';
    const onBreakClick = () => {
      this._setBroken(!this._isBroken, true);
    };
    breakBtn.addEventListener('click', onBreakClick);
    this._cleanups.push(() => breakBtn.removeEventListener('click', onBreakClick));
    this._chromeBreakBtn = breakBtn;
    chromeRight.appendChild(breakBtn);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'el-reset-btn';
    resetBtn.setAttribute('data-lab-reset', 'true');
    resetBtn.textContent = 'Reset';
    const onResetClick = () => {
      this._handleReset();
    };
    resetBtn.addEventListener('click', onResetClick);
    this._cleanups.push(() => resetBtn.removeEventListener('click', onResetClick));
    chromeRight.appendChild(resetBtn);

    chrome.appendChild(chromeLeft);
    chrome.appendChild(chromeRight);
    frame.appendChild(chrome);

    // 2. Live Telemetry HUD Strip (zero DOM rebuilds at 60 FPS)
    const telemetryDefs = Array.isArray(labModule.telemetryDefs) ? labModule.telemetryDefs : [];
    if (telemetryDefs.length > 0) {
      const strip = document.createElement('div');
      strip.className = 'el-telemetry-strip';
      strip.setAttribute('data-telemetry-hud', 'true');

      for (const def of telemetryDefs) {
        if (!def) continue;
        const key = def.id || def.key;
        if (!key) continue;

        const token = PHOSPHOR[def.color] || PHOSPHOR.cyan;
        const badge = document.createElement('div');
        badge.className = 'el-metric-badge';
        badge.setAttribute('data-metric', key);

        const labelEl = document.createElement('span');
        labelEl.className = 'el-metric-label';
        labelEl.textContent = def.label || key;
        badge.appendChild(labelEl);

        const valRow = document.createElement('div');
        valRow.className = 'el-metric-val-row';

        const valEl = document.createElement('span');
        valEl.className = 'el-metric-val';
        valEl.style.setProperty('--m-color', token.hex);
        const initialText = formatTelemetryValue(
          def.initialValue !== undefined ? def.initialValue : 0,
          def
        );
        valEl.textContent = initialText;
        valRow.appendChild(valEl);

        let unitEl = null;
        if (def.unit) {
          unitEl = document.createElement('span');
          unitEl.className = 'el-metric-unit';
          unitEl.textContent = def.unit;
          valRow.appendChild(unitEl);
        }

        badge.appendChild(valRow);
        strip.appendChild(badge);

        this._telemetryRefs.set(key, {
          valEl,
          unitEl,
          def,
          lastText: initialText,
          lastColor: def.color || 'cyan',
        });
      }

      frame.appendChild(strip);
    }

    // 3. Inline Fault Banner (only visible in Break Mode) + Dead-Front Interactive Canvas Stage
    const faultOverlay = document.createElement('div');
    faultOverlay.className = 'el-fault-overlay';
    const faultTitle =
      (labModule.breakMode && (labModule.breakMode.activeBanner || labModule.breakMode.title)) ||
      'Fault Injected — Observing System Breakdown';
    faultOverlay.innerHTML = `<span style="color:#FF1744;font-size:13px;">⚡</span><span>${escapeHtml(faultTitle)}</span>`;
    frame.appendChild(faultOverlay);

    const canvasStage = document.createElement('div');
    canvasStage.className = 'el-canvas-stage';

    const canvasHost = document.createElement('div');
    canvasHost.className = 'el-canvas-host';
    canvasHost.setAttribute('data-canvas-host', 'true');
    canvasStage.appendChild(canvasHost);

    frame.appendChild(canvasStage);
    viewportCol.appendChild(frame);

    // 4. LinkedEquationBar mounted directly beneath canvas
    const eqHost = document.createElement('div');
    eqHost.setAttribute('data-linked-eq-host', 'true');
    viewportCol.appendChild(eqHost);

    if (labModule.equationSpec) {
      this._linkedEq = new LinkedEquationBar();
      this._linkedEq.mount(eqHost, labModule.equationSpec, {
        onHoverVar: (key) => {
          this._hoveredVar = key;
          for (const cb of this._hoverListeners) {
            try {
              cb(key);
            } catch (err) {
              console.error('[FrontierLessonShell] onHoverVar subscriber error:', err);
            }
          }
        },
      });
    }

    grid.appendChild(viewportCol);

    // =========================================================================
    // RIGHT COLUMN: 6-Step Progressive Micro-Step Drawer
    // =========================================================================
    const drawer = this._buildDrawer(labModule, dagNode);
    grid.appendChild(drawer);

    root.appendChild(grid);
    container.textContent = '';
    container.appendChild(root);
    this._root = root;

    // Build lab API and mount canvas engine
    const api = this._createLabApi();
    if (typeof labModule.mountCanvas === 'function') {
      try {
        this._labCleanup = labModule.mountCanvas(canvasHost, api);
      } catch (err) {
        console.error('[FrontierLessonShell] mountCanvas failed:', err);
        canvasHost.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;color:#FF8096;font-family:monospace;font-size:12px;">Simulation failed to initialize: ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
      }
    }

    return this;
  }

  _buildDrawer(labModule, dagNode) {
    const drawer = document.createElement('aside');
    drawer.className = 'el-drawer';
    drawer.setAttribute('data-micro-drawer', 'true');

    // Step indicator strip
    const strip = document.createElement('div');
    strip.className = 'el-step-strip';
    this._stepButtons = [];

    for (const meta of STEP_META) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'el-step-dot-btn';
      btn.setAttribute('data-step-index', String(meta.index));
      btn.setAttribute('data-active', meta.index === 0 ? 'true' : 'false');
      btn.setAttribute('data-done', meta.index === 4 && this._quizSolved ? 'true' : 'false');
      btn.title = `${meta.index + 1}. ${meta.title}`;

      const pip = document.createElement('span');
      pip.className = 'el-step-pip';
      btn.appendChild(pip);

      const lbl = document.createElement('span');
      lbl.textContent = meta.short.split(' ')[1];
      btn.appendChild(lbl);

      const onStepClick = () => {
        sound.playTick();
        this._goToStep(meta.index);
      };
      btn.addEventListener('click', onStepClick);
      this._cleanups.push(() => btn.removeEventListener('click', onStepClick));

      this._stepButtons.push(btn);
      strip.appendChild(btn);
    }
    drawer.appendChild(strip);

    // Drawer Body with all 6 persistent panes
    const body = document.createElement('div');
    body.className = 'el-drawer-body';
    this._stepPanes = [];

    const panes = [
      this._buildConceptPane(labModule),
      this._buildExplorePane(labModule),
      this._buildLinkedMathPane(labModule),
      this._buildBreakPane(labModule),
      this._buildIntuitionCheckPane(labModule),
      this._buildFrontierBridgePane(labModule, dagNode),
    ];

    panes.forEach((pane, idx) => {
      pane.className = 'el-step-pane';
      pane.setAttribute('data-step-pane', String(idx));
      pane.setAttribute('data-visible', idx === 0 ? 'true' : 'false');
      this._stepPanes.push(pane);
      body.appendChild(pane);
    });

    drawer.appendChild(body);

    // Drawer Footer (Prev / Step X of 6 / Next)
    const footer = document.createElement('div');
    footer.className = 'el-drawer-footer';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'el-reset-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = true;
    const onPrev = () => {
      if (this._activeStep > 0) {
        sound.playTick();
        this._goToStep(this._activeStep - 1);
      }
    };
    prevBtn.addEventListener('click', onPrev);
    this._cleanups.push(() => prevBtn.removeEventListener('click', onPrev));
    this._prevBtn = prevBtn;

    const counter = document.createElement('span');
    counter.style.cssText =
      "font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A96B0;font-weight:600;";
    counter.textContent = 'Step 1 / 6';
    this._stepCounterEl = counter;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-glow-cyan';
    nextBtn.style.cssText = 'padding:7px 14px;font-size:12.5px;';
    nextBtn.textContent = 'Next →';
    const onNext = () => {
      if (this._activeStep < STEP_META.length - 1) {
        sound.playTick();
        this._goToStep(this._activeStep + 1);
      }
    };
    nextBtn.addEventListener('click', onNext);
    this._cleanups.push(() => nextBtn.removeEventListener('click', onNext));
    this._nextBtn = nextBtn;

    footer.appendChild(prevBtn);
    footer.appendChild(counter);
    footer.appendChild(nextBtn);
    drawer.appendChild(footer);

    return drawer;
  }

  _buildPaneHeader(kicker, title, accentHex = '#00E5FF') {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
    wrap.innerHTML = `
      <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${accentHex};">${escapeHtml(kicker)}</span>
      <h3 style="margin:0;font-family:'Space Grotesk',system-ui,sans-serif;font-size:17px;font-weight:700;color:#F8FAFC;line-height:1.25;">${escapeHtml(title)}</h3>
    `;
    return wrap;
  }

  _buildConceptPane(labModule) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'concept', 0);
    pane.appendChild(
      this._buildPaneHeader('STEP 1 · CONCEPT', step.title || 'Visual Intuition', '#00E5FF')
    );

    const bodyText =
      step.body ||
      step.summary ||
      step.text ||
      'Observe the live physical simulation on the left. Every geometric element directly encodes an invariant of the underlying dynamical system.';

    const p = document.createElement('p');
    p.style.cssText = 'margin:0;font-size:13.5px;line-height:1.58;color:#CBD5E1;';
    p.innerHTML = renderRichText(bodyText);
    pane.appendChild(p);

    const bullets = Array.isArray(step.bullets)
      ? step.bullets
      : Array.isArray(step.lookFor)
        ? step.lookFor
        : [];
    if (bullets.length > 0) {
      const box = document.createElement('div');
      box.style.cssText =
        'padding:11px 12px;border-radius:12px;background:rgba(10,12,16,0.68);border:1px solid rgba(0,229,255,0.2);display:flex;flex-direction:column;gap:7px;';
      const lbl = document.createElement('div');
      lbl.style.cssText =
        "font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#80F2FF;";
      lbl.textContent = 'WHAT TO WATCH IN THE VIEWPORT';
      box.appendChild(lbl);

      for (const b of bullets) {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:flex-start;gap:7px;font-size:12.5px;line-height:1.45;color:#DCE4F2;';
        item.innerHTML = `<span style="color:#00E5FF;font-weight:700;flex-shrink:0;">▸</span><span>${renderRichText(b)}</span>`;
        box.appendChild(item);
      }
      pane.appendChild(box);
    }

    if (step.tip || step.callout) {
      const tip = document.createElement('div');
      tip.style.cssText =
        'padding:10px 12px;border-radius:11px;background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.28);font-size:12.5px;line-height:1.45;color:#B9FBD5;';
      tip.innerHTML = renderRichText(step.tip || step.callout);
      pane.appendChild(tip);
    }

    return pane;
  }

  _buildExplorePane(labModule) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'explore', 1);
    pane.appendChild(
      this._buildPaneHeader('STEP 2 · EXPLORE', step.title || 'Manipulate Live Parameters', '#00E676')
    );

    if (step.body || step.prompt || step.text) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;font-size:13px;line-height:1.5;color:#CBD5E1;';
      p.innerHTML = renderRichText(step.body || step.prompt || step.text);
      pane.appendChild(p);
    }

    // Optional quick presets
    const presets = Array.isArray(labModule.presets)
      ? labModule.presets
      : Array.isArray(step.presets)
        ? step.presets
        : [];
    if (presets.length > 0) {
      const presetWrap = document.createElement('div');
      presetWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
      for (const preset of presets) {
        if (!preset) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'el-reset-btn';
        btn.style.cssText = 'font-size:11.5px;padding:5px 10px;border-radius:8px;';
        btn.textContent = preset.label || 'Preset';
        const onPreset = () => {
          sound.playSnap();
          if (preset.values && typeof preset.values === 'object') {
            for (const [k, v] of Object.entries(preset.values)) {
              this._setControlValueInternal(k, v, true);
            }
          }
          if (typeof preset.breakMode === 'boolean') {
            this._setBroken(preset.breakMode, true);
          }
        };
        btn.addEventListener('click', onPreset);
        this._cleanups.push(() => btn.removeEventListener('click', onPreset));
        presetWrap.appendChild(btn);
      }
      pane.appendChild(presetWrap);
    }

    // Controls list
    const controls = Array.isArray(labModule.controls) ? labModule.controls : [];
    const controlsList = document.createElement('div');
    controlsList.style.cssText = 'display:flex;flex-direction:column;gap:9px;';

    for (const ctrl of controls) {
      if (!ctrl || !ctrl.id) continue;
      const card = this._buildControlCard(ctrl);
      controlsList.appendChild(card);
    }

    if (controls.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText =
        'padding:12px;border-radius:11px;background:rgba(10,12,16,0.65);border:1px solid rgba(255,255,255,0.08);font-size:12.5px;color:#94A3B8;';
      empty.textContent = 'Drag or interact directly inside the live viewport canvas.';
      controlsList.appendChild(empty);
    }

    pane.appendChild(controlsList);
    return pane;
  }

  _buildControlCard(ctrl) {
    const card = document.createElement('div');
    card.className = 'el-control-card';
    card.setAttribute('data-control-id', ctrl.id);

    const type = ctrl.type || (ctrl.min !== undefined || ctrl.max !== undefined ? 'slider' : 'toggle');
    const token = PHOSPHOR[ctrl.color] || PHOSPHOR.cyan;

    if (type === 'toggle' || type === 'boolean') {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;';

      const lblWrap = document.createElement('div');
      lblWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:12.5px;font-weight:600;color:#F1F5F9;';
      lbl.textContent = ctrl.label || ctrl.id;
      lblWrap.appendChild(lbl);
      if (ctrl.hint) {
        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:11px;color:#8592AA;';
        hint.textContent = ctrl.hint;
        lblWrap.appendChild(hint);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      const initialBool = Boolean(this._controlValues[ctrl.id]);
      btn.setAttribute('role', 'switch');
      btn.setAttribute('aria-checked', String(initialBool));
      btn.style.cssText =
        'position:relative;width:44px;height:24px;border-radius:9999px;border:1px solid rgba(255,255,255,0.16);cursor:pointer;transition:background-color 0.18s ease,border-color 0.18s ease;flex-shrink:0;';

      const knob = document.createElement('span');
      knob.style.cssText =
        'position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:9999px;background:#F8FAFC;transition:transform 0.18s ease;';
      btn.appendChild(knob);

      const syncToggleUi = (val) => {
        const on = Boolean(val);
        btn.setAttribute('aria-checked', String(on));
        btn.style.background = on ? `rgba(${token.rgb}, 0.35)` : 'rgba(255,255,255,0.08)';
        btn.style.borderColor = on ? token.hex : 'rgba(255,255,255,0.16)';
        knob.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
        knob.style.background = on ? token.hex : '#CBD5E1';
      };
      syncToggleUi(initialBool);

      const onClick = () => {
        sound.playTick();
        const nextVal = !Boolean(this._controlValues[ctrl.id]);
        this._setControlValueInternal(ctrl.id, nextVal, true);
      };
      btn.addEventListener('click', onClick);
      this._cleanups.push(() => btn.removeEventListener('click', onClick));

      this._controlRefs.set(ctrl.id, { type: 'toggle', updateUi: syncToggleUi });

      row.appendChild(lblWrap);
      row.appendChild(btn);
      card.appendChild(row);
      return card;
    }

    if (type === 'select' || type === 'segmented' || type === 'presets') {
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:12px;font-weight:600;color:#CBD5E1;';
      lbl.textContent = ctrl.label || ctrl.id;
      card.appendChild(lbl);

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;';
      const opts = Array.isArray(ctrl.options) ? ctrl.options : [];
      const optButtons = [];

      const syncSegmented = (activeVal) => {
        for (const item of optButtons) {
          const isSel = String(item.value) === String(activeVal);
          item.el.style.borderColor = isSel ? token.hex : 'rgba(255,255,255,0.1)';
          item.el.style.background = isSel ? `rgba(${token.rgb}, 0.18)` : 'rgba(255,255,255,0.04)';
          item.el.style.color = isSel ? '#F8FAFC' : '#94A3B8';
        }
      };

      for (const opt of opts) {
        const val = typeof opt === 'object' ? opt.value : opt;
        const text = typeof opt === 'object' ? opt.label || String(opt.value) : String(opt);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText =
          "padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s ease;";
        btn.textContent = text;
        const onClick = () => {
          sound.playTick();
          this._setControlValueInternal(ctrl.id, val, true);
        };
        btn.addEventListener('click', onClick);
        this._cleanups.push(() => btn.removeEventListener('click', onClick));
        optButtons.push({ value: val, el: btn });
        btnRow.appendChild(btn);
      }

      syncSegmented(this._controlValues[ctrl.id]);
      this._controlRefs.set(ctrl.id, { type: 'select', updateUi: syncSegmented });

      card.appendChild(btnRow);
      return card;
    }

    if (type === 'button' || type === 'action') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-glass';
      btn.style.cssText = `width:100%;font-size:12.5px;border-color:rgba(${token.rgb},0.4);color:${token.soft};`;
      btn.textContent = ctrl.actionLabel || ctrl.label || ctrl.id;
      const onClick = () => {
        sound.playSnap();
        if (typeof ctrl.onClick === 'function') ctrl.onClick();
        this._notifyControlChange(ctrl.id, Date.now());
      };
      btn.addEventListener('click', onClick);
      this._cleanups.push(() => btn.removeEventListener('click', onClick));
      card.appendChild(btn);
      return card;
    }

    // Default: tactile slider control
    const min = ctrl.min !== undefined ? Number(ctrl.min) : 0;
    const max = ctrl.max !== undefined ? Number(ctrl.max) : 1;
    const step = ctrl.step !== undefined ? Number(ctrl.step) : 0.01;
    const initialNum = Number(this._controlValues[ctrl.id]);

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';

    const lbl = document.createElement('label');
    lbl.style.cssText = 'font-size:12.5px;font-weight:600;color:#E2E8F0;';
    lbl.textContent = ctrl.label || ctrl.id;

    const readout = document.createElement('span');
    readout.style.cssText = `font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${token.hex};font-variant-numeric:tabular-nums;`;

    head.appendChild(lbl);
    head.appendChild(readout);
    card.appendChild(head);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = ctrl.color === 'amber' ? 'studio-slider-amber' : 'studio-slider-cyan';
    input.style.setProperty('--slider-accent', token.hex);
    input.style.setProperty('--slider-accent-rgb', token.rgb);
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(Number.isFinite(initialNum) ? initialNum : min);

    const formatReadout = (num) => {
      if (typeof ctrl.format === 'function') {
        try {
          return String(ctrl.format(num));
        } catch {
          // Fallback
        }
      }
      const decimals = Number.isInteger(ctrl.decimals)
        ? ctrl.decimals
        : step >= 1
          ? 0
          : step >= 0.1
            ? 1
            : 2;
      const numStr = Number(num).toFixed(decimals);
      return ctrl.unit ? `${numStr} ${ctrl.unit}` : numStr;
    };

    const syncSliderUi = (val) => {
      const n = Number(val);
      const clamped = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
      input.value = String(clamped);
      const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
      input.style.setProperty('--slider-pct', `${pct.toFixed(1)}%`);
      readout.textContent = formatReadout(clamped);
    };
    syncSliderUi(initialNum);

    const onInput = () => {
      const num = parseFloat(input.value);
      sound.playTick();
      this._setControlValueInternal(ctrl.id, num, true);
    };
    input.addEventListener('input', onInput);
    this._cleanups.push(() => input.removeEventListener('input', onInput));

    this._controlRefs.set(ctrl.id, { type: 'slider', updateUi: syncSliderUi });

    card.appendChild(input);

    if (ctrl.hint) {
      const hint = document.createElement('span');
      hint.style.cssText = 'font-size:11px;color:#7D89A3;line-height:1.35;';
      hint.textContent = ctrl.hint;
      card.appendChild(hint);
    }

    return card;
  }

  _buildLinkedMathPane(labModule) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'linkedMath', 2);
    pane.appendChild(
      this._buildPaneHeader('STEP 3 · LINKED MATH', step.title || 'Symbols Linked to Geometry', '#A78BFA')
    );

    const intro =
      step.body ||
      step.text ||
      'Hover or tap any variable pill in the live equation bar beneath the canvas (or below) to illuminate the exact geometric object it controls.';
    const p = document.createElement('p');
    p.style.cssText = 'margin:0;font-size:13px;line-height:1.55;color:#CBD5E1;';
    p.innerHTML = renderRichText(intro);
    pane.appendChild(p);

    const parts =
      labModule.equationSpec && Array.isArray(labModule.equationSpec.parts)
        ? labModule.equationSpec.parts.filter((pt) => pt && pt.type === 'var' && pt.key)
        : [];

    if (parts.length > 0) {
      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:7px;';
      const seen = new Set();

      for (const pt of parts) {
        if (seen.has(pt.key)) continue;
        seen.add(pt.key);
        const token = PHOSPHOR[pt.color] || PHOSPHOR.cyan;

        const row = document.createElement('button');
        row.type = 'button';
        row.style.cssText = `width:100%;text-align:left;padding:9px 11px;border-radius:11px;border:1px solid rgba(${token.rgb},0.28);background:rgba(${token.rgb},0.07);color:#E2E8F0;cursor:pointer;display:flex;align-items:flex-start;gap:10px;transition:all 0.15s ease;`;
        row.innerHTML = `
          <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${token.soft};padding:2px 7px;border-radius:6px;background:rgba(${token.rgb},0.16);flex-shrink:0;">${escapeHtml(pt.symbol || pt.key)}</span>
          <span style="font-size:12px;line-height:1.45;color:#CBD5E1;">${renderRichText(pt.tooltip || pt.label || 'Highlight in canvas')}</span>
        `;

        const onEnter = () => {
          this._highlightFromDrawer(pt.key);
        };
        const onLeave = () => {
          this._highlightFromDrawer(null);
        };
        const onClick = () => {
          sound.playTick();
          const next = this._hoveredVar === pt.key ? null : pt.key;
          this._highlightFromDrawer(next);
        };

        row.addEventListener('pointerenter', onEnter);
        row.addEventListener('pointerleave', onLeave);
        row.addEventListener('click', onClick);
        this._cleanups.push(() => {
          row.removeEventListener('pointerenter', onEnter);
          row.removeEventListener('pointerleave', onLeave);
          row.removeEventListener('click', onClick);
        });

        list.appendChild(row);
      }
      pane.appendChild(list);
    }

    return pane;
  }

  _highlightFromDrawer(key) {
    this._hoveredVar = key;
    if (this._linkedEq) {
      this._linkedEq.setHighlightedVar(key);
    }
    for (const cb of this._hoverListeners) {
      try {
        cb(key);
      } catch (err) {
        console.error('[FrontierLessonShell] onHoverVar subscriber error:', err);
      }
    }
  }

  _buildBreakPane(labModule) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'breakSystem', 3);
    const bm = labModule.breakMode || {};

    pane.appendChild(
      this._buildPaneHeader(
        'STEP 4 · ADVERSARIAL FAULT',
        step.title || bm.title || '⚡ Break the System',
        '#FF1744'
      )
    );

    const desc =
      step.body ||
      bm.description ||
      'Real Physical AI failures happen when mathematical invariants collapse. Inject a live fault into the simulation to watch the failure mode unfold, then recover the system.';
    const p = document.createElement('p');
    p.style.cssText = 'margin:0;font-size:13px;line-height:1.55;color:#CBD5E1;';
    p.innerHTML = renderRichText(desc);
    pane.appendChild(p);

    const faultBtn = document.createElement('button');
    faultBtn.type = 'button';
    faultBtn.className = 'el-break-btn';
    faultBtn.style.cssText = 'width:100%;justify-content:center;padding:11px 14px;font-size:13.5px;';
    faultBtn.setAttribute('data-active', 'false');
    faultBtn.textContent = bm.triggerLabel || '⚡ Inject System Fault';
    const onClick = () => {
      this._setBroken(!this._isBroken, true);
    };
    faultBtn.addEventListener('click', onClick);
    this._cleanups.push(() => faultBtn.removeEventListener('click', onClick));
    this._drawerBreakBtn = faultBtn;
    pane.appendChild(faultBtn);

    if (bm.failureSymptom || step.symptom) {
      const card = document.createElement('div');
      card.style.cssText =
        'padding:11px 12px;border-radius:12px;background:rgba(255,23,68,0.09);border:1px solid rgba(255,23,68,0.32);display:flex;flex-direction:column;gap:4px;';
      card.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FF8096;">FAILURE MODE SIGNATURE</span>
        <span style="font-size:12.5px;line-height:1.45;color:#FFE4EA;">${renderRichText(bm.failureSymptom || step.symptom)}</span>
      `;
      pane.appendChild(card);
    }

    if (bm.recoveryHint || step.recovery) {
      const rec = document.createElement('div');
      rec.style.cssText =
        'padding:11px 12px;border-radius:12px;background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.28);display:flex;flex-direction:column;gap:4px;';
      rec.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86F7BC;">ENGINEERING RECOVERY</span>
        <span style="font-size:12.5px;line-height:1.45;color:#D1FAE5;">${renderRichText(bm.recoveryHint || step.recovery)}</span>
      `;
      pane.appendChild(rec);
    }

    return pane;
  }

  _buildIntuitionCheckPane(labModule) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'intuitionCheck', 4);
    const quiz = labModule.intuitionCheck || step.quiz || step;

    pane.appendChild(
      this._buildPaneHeader(
        'STEP 5 · INTUITION CHECK',
        step.title || 'Verify Your Mental Model',
        '#FFB300'
      )
    );

    const questionText =
      quiz.question || quiz.prompt || 'Which physical invariant best explains what you just observed?';
    const qEl = document.createElement('p');
    qEl.style.cssText = 'margin:0;font-size:13.5px;font-weight:600;line-height:1.5;color:#F8FAFC;';
    qEl.innerHTML = renderRichText(questionText);
    pane.appendChild(qEl);

    const options = Array.isArray(quiz.options) ? quiz.options : [];
    const optList = document.createElement('div');
    optList.style.cssText = 'display:flex;flex-direction:column;gap:7px;';

    const feedbackBox = document.createElement('div');
    feedbackBox.style.cssText =
      'display:none;padding:11px 12px;border-radius:11px;font-size:12.5px;line-height:1.48;';

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optButtons = [];

    options.forEach((opt, idx) => {
      const optObj = typeof opt === 'object' && opt !== null ? opt : { text: String(opt) };
      const isCorrect =
        optObj.correct === true ||
        (typeof quiz.correctIndex === 'number' && quiz.correctIndex === idx) ||
        (quiz.correctId !== undefined && optObj.id === quiz.correctId);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'el-quiz-opt';
      btn.setAttribute('data-option-index', String(idx));
      btn.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,0.08);color:#94A3B8;flex-shrink:0;">${letters[idx] || idx + 1}</span>
        <span>${renderRichText(optObj.text || optObj.label || '')}</span>
      `;

      const onPick = () => {
        for (const b of optButtons) {
          b.removeAttribute('data-state');
        }

        feedbackBox.style.display = 'block';
        if (isCorrect) {
          btn.setAttribute('data-state', 'correct');
          sound.playSuccess();
          this._quizSolved = true;
          if (this._stepButtons[4]) {
            this._stepButtons[4].setAttribute('data-done', 'true');
          }
          if (labModule.nodeId) {
            markFrontierCompleted(labModule.nodeId);
            if (typeof this._options.onCompleteNode === 'function') {
              try {
                this._options.onCompleteNode(labModule.nodeId);
              } catch (err) {
                console.error('[FrontierLessonShell] onCompleteNode error:', err);
              }
            }
          }
          feedbackBox.style.background = 'rgba(0, 230, 118, 0.12)';
          feedbackBox.style.border = '1px solid rgba(0, 230, 118, 0.45)';
          feedbackBox.style.color = '#D1FAE5';
          const expl =
            optObj.feedback ||
            quiz.explanation ||
            quiz.correctFeedback ||
            'Exact physical intuition locked in. Module marked mastered on your Skill Graph!';
          feedbackBox.innerHTML = `<strong style="color:#00E676;">✓ Mastered!</strong> ${renderRichText(expl)}`;
        } else {
          btn.setAttribute('data-state', 'wrong');
          sound.playGentleError();
          feedbackBox.style.background = 'rgba(255, 23, 68, 0.12)';
          feedbackBox.style.border = '1px solid rgba(255, 23, 68, 0.42)';
          feedbackBox.style.color = '#FFE4EA';
          const hint =
            optObj.feedback ||
            quiz.wrongFeedback ||
            'Not quite — test the simulation controls or trigger Break the System and check the telemetry again.';
          feedbackBox.innerHTML = `<strong style="color:#FF8096;">Try again:</strong> ${renderRichText(hint)}`;
        }
      };

      btn.addEventListener('click', onPick);
      this._cleanups.push(() => btn.removeEventListener('click', onPick));
      optButtons.push(btn);
      optList.appendChild(btn);
    });

    if (this._quizSolved) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(0, 230, 118, 0.11)';
      feedbackBox.style.border = '1px solid rgba(0, 230, 118, 0.38)';
      feedbackBox.style.color = '#D1FAE5';
      feedbackBox.innerHTML =
        '<strong style="color:#00E676;">✓ Completed</strong> — This lab is lit up Emerald in your Frontier Skill Graph.';
    }

    pane.appendChild(optList);
    pane.appendChild(feedbackBox);

    return pane;
  }

  _buildFrontierBridgePane(labModule, dagNode) {
    const pane = document.createElement('div');
    const step = resolveStepContent(labModule.steps, 'frontierBridge', 5);
    const bridge = labModule.frontierBridge || {};

    pane.appendChild(
      this._buildPaneHeader(
        'STEP 6 · FRONTIER BRIDGE',
        step.title || 'Why This Matters for Physical AI',
        '#00E676'
      )
    );

    const whyText =
      bridge.whyItMatters ||
      bridge.why ||
      step.body ||
      (dagNode && dagNode.frontierBridge && dagNode.frontierBridge.whyItMatters) ||
      (dagNode && dagNode.summary) ||
      'This mathematical invariant directly underpins real-time physical robotics, embodied perception, and safe autonomy.';

    const callout = document.createElement('div');
    callout.style.cssText =
      'padding:12px 13px;border-radius:12px;background:linear-gradient(160deg,rgba(0,229,255,0.1) 0%,rgba(0,230,118,0.08) 100%);border:1px solid rgba(0,229,255,0.32);font-size:13px;line-height:1.55;color:#E2F8FF;';
    callout.innerHTML = renderRichText(whyText);
    pane.appendChild(callout);

    // Resolve prerequisites & unlocks from labModule.frontierBridge or DAG curriculum
    const prereqIds = Array.isArray(bridge.prereqs)
      ? bridge.prereqs
      : dagNode && Array.isArray(dagNode.prereqs)
        ? dagNode.prereqs
        : [];

    let unlockIds = Array.isArray(bridge.unlocks) ? bridge.unlocks : [];
    if (unlockIds.length === 0 && labModule.nodeId) {
      try {
        const direct = getDirectUnlocks(labModule.nodeId);
        if (Array.isArray(direct)) {
          unlockIds = direct.map((item) => (typeof item === 'string' ? item : item && item.id)).filter(Boolean);
        }
      } catch {
        // Fallback silently if DAG lookup unavailable
      }
    }

    const renderNavSection = (heading, ids, accentHex) => {
      if (!ids || ids.length === 0) return;
      const section = document.createElement('div');
      section.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

      const lbl = document.createElement('span');
      lbl.style.cssText = `font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${accentHex};`;
      lbl.textContent = heading;
      section.appendChild(lbl);

      for (const entry of ids) {
        const nodeId = typeof entry === 'string' ? entry : entry && (entry.id || entry.nodeId);
        const node = nodeId ? getDagNode(nodeId) : null;
        const track = node && node.trackId ? getDagTrack(node.trackId) : null;
        const title = (typeof entry === 'object' && entry.title) || (node && node.title) || nodeId;
        const isLive =
          (typeof entry === 'object' && entry.status === 'implemented') ||
          (node && node.status === 'implemented');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'el-nav-card';
        btn.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${accentHex};">${escapeHtml(nodeId)}</span>
              ${isLive ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;padding:1px 6px;border-radius:9999px;background:rgba(0,229,255,0.16);border:1px solid rgba(0,229,255,0.45);color:#80F2FF;">LIVE</span>' : '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:#6C7893;">ROADMAP</span>'}
            </div>
            <span style="font-size:12.5px;font-weight:600;color:#F1F5F9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</span>
            ${track ? `<span style="font-size:10.5px;color:#7D89A3;">${escapeHtml(track.title || track.name || '')}</span>` : ''}
          </div>
          <span style="font-size:14px;color:${accentHex};flex-shrink:0;">→</span>
        `;

        const onNav = () => {
          sound.playTick();
          if (typeof this._options.onNavigateNode === 'function' && nodeId) {
            this._options.onNavigateNode(nodeId);
          }
        };
        btn.addEventListener('click', onNav);
        this._cleanups.push(() => btn.removeEventListener('click', onNav));
        section.appendChild(btn);
      }

      pane.appendChild(section);
    };

    renderNavSection('UPSTREAM PREREQUISITES', prereqIds, '#FFB300');
    renderNavSection('UNLOCKED FRONTIER MODULES', unlockIds, '#00E676');

    if (typeof this._options.onBackToGraph === 'function') {
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'btn-glass';
      backBtn.style.cssText = 'width:100%;margin-top:4px;font-size:12.5px;';
      backBtn.textContent = '← Return to Full Frontier Skill Graph';
      const onBack = () => {
        sound.playTick();
        this._options.onBackToGraph();
      };
      backBtn.addEventListener('click', onBack);
      this._cleanups.push(() => backBtn.removeEventListener('click', onBack));
      pane.appendChild(backBtn);
    }

    return pane;
  }

  _goToStep(stepIdx) {
    const clamped = Math.max(0, Math.min(STEP_META.length - 1, stepIdx));
    this._activeStep = clamped;

    this._stepButtons.forEach((btn, idx) => {
      btn.setAttribute('data-active', idx === clamped ? 'true' : 'false');
    });
    this._stepPanes.forEach((pane, idx) => {
      pane.setAttribute('data-visible', idx === clamped ? 'true' : 'false');
    });

    if (this._prevBtn) this._prevBtn.disabled = clamped === 0;
    if (this._nextBtn) {
      this._nextBtn.disabled = clamped === STEP_META.length - 1;
      this._nextBtn.textContent = clamped === STEP_META.length - 1 ? 'End of Guide' : 'Next →';
    }
    if (this._stepCounterEl) {
      this._stepCounterEl.textContent = `Step ${clamped + 1} / ${STEP_META.length}`;
    }
  }

  _setBroken(flag, notifyListeners) {
    const next = Boolean(flag);
    const changed = next !== this._isBroken;
    this._isBroken = next;

    if (this._viewportFrameEl) {
      this._viewportFrameEl.setAttribute('data-broken', next ? 'true' : 'false');
    }

    const bm = (this._labModule && this._labModule.breakMode) || {};
    if (this._chromeBreakBtn) {
      this._chromeBreakBtn.setAttribute('data-active', next ? 'true' : 'false');
      this._chromeBreakBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      this._chromeBreakBtn.textContent = next
        ? bm.recoverLabel || '✓ Recover System'
        : bm.buttonLabel || '⚡ Break the System';
    }
    if (this._drawerBreakBtn) {
      this._drawerBreakBtn.setAttribute('data-active', next ? 'true' : 'false');
      this._drawerBreakBtn.textContent = next
        ? bm.recoverLabel || '✓ Restore Safe Invariant'
        : bm.triggerLabel || '⚡ Inject System Fault';
    }

    if (changed) {
      if (next) {
        sound.playGentleError();
      } else {
        sound.playSnap();
      }
      if (notifyListeners) {
        for (const cb of this._breakListeners) {
          try {
            cb(next);
          } catch (err) {
            console.error('[FrontierLessonShell] onBreakToggle subscriber error:', err);
          }
        }
      }
    }
  }

  _setControlValueInternal(id, val, notifyListeners) {
    this._controlValues[id] = val;
    const ref = this._controlRefs.get(id);
    if (ref && typeof ref.updateUi === 'function') {
      ref.updateUi(val);
    }
    if (notifyListeners) {
      this._notifyControlChange(id, val);
    }
  }

  _notifyControlChange(id, val) {
    const snapshot = { ...this._controlValues };
    for (const cb of this._controlListeners) {
      try {
        cb(id, val, snapshot);
      } catch (err) {
        console.error('[FrontierLessonShell] onControlChange subscriber error:', err);
      }
    }
  }

  _handleReset() {
    sound.playSnap();
    this._setBroken(false, true);
    for (const [id, initVal] of Object.entries(this._initialControlValues)) {
      this._setControlValueInternal(id, initVal, true);
    }
    if (this._linkedEq) {
      this._linkedEq.setHighlightedVar(null);
    }
    this._hoveredVar = null;
    for (const cb of this._resetListeners) {
      try {
        cb();
      } catch (err) {
        console.error('[FrontierLessonShell] onReset subscriber error:', err);
      }
    }
  }

  _updateStatusPill(status) {
    if (!this._statusPillEl || !this._statusDotEl || !this._statusTextEl) return;
    const { level, label } = normalizeStatusLevel(status);
    const cacheKey = `${level}:${label}`;
    if (cacheKey === this._lastStatusKey) return;
    this._lastStatusKey = cacheKey;

    const preset = STATUS_PRESETS[level] || STATUS_PRESETS.safe;
    this._statusPillEl.setAttribute('data-status-pill', level);
    this._statusPillEl.style.borderColor = `rgba(${preset.rgb}, 0.52)`;
    this._statusPillEl.style.backgroundColor = `rgba(${preset.rgb}, 0.14)`;
    this._statusPillEl.style.color = preset.text;
    this._statusDotEl.style.backgroundColor = preset.hex;
    this._statusDotEl.style.boxShadow = `0 0 9px ${preset.hex}`;
    this._statusTextEl.textContent = label;
  }

  _createLabApi() {
    return {
      /**
       * 60 FPS safe telemetry & status indicator update (direct textContent refs).
       */
      updateTelemetry: (values, status) => {
        if (values && typeof values === 'object') {
          for (const key of Object.keys(values)) {
            const ref = this._telemetryRefs.get(key);
            if (!ref) continue;
            const raw = values[key];
            const isObj = raw !== null && typeof raw === 'object' && !Array.isArray(raw);
            const val = isObj ? raw.value : raw;
            const nextText = formatTelemetryValue(val, ref.def);
            if (nextText !== ref.lastText) {
              ref.valEl.textContent = nextText;
              ref.lastText = nextText;
            }
            if (isObj && typeof raw.color === 'string' && raw.color !== ref.lastColor) {
              const token = PHOSPHOR[raw.color] || PHOSPHOR.cyan;
              ref.valEl.style.setProperty('--m-color', token.hex);
              ref.lastColor = raw.color;
            }
            if (isObj && typeof raw.unit === 'string' && ref.unitEl && ref.unitEl.textContent !== raw.unit) {
              ref.unitEl.textContent = raw.unit;
            }
          }
        }
        if (status !== undefined) {
          this._updateStatusPill(status);
        }
      },

      /**
       * 60 FPS safe linked equation variable readout update.
       */
      updateEquation: (values) => {
        if (this._linkedEq) {
          this._linkedEq.updateValues(values);
        }
      },

      /**
       * Programmatically update a control value in the Explore drawer.
       */
      setControlValue: (id, val, opts = {}) => {
        this._setControlValueInternal(id, val, Boolean(opts && opts.notify));
      },

      getControlValue: (id) => this._controlValues[id],

      getControls: () => ({ ...this._controlValues }),

      isBroken: () => this._isBroken,

      setBroken: (flag) => {
        this._setBroken(flag, true);
      },

      getHoveredVar: () => this._hoveredVar,

      setHighlightedVar: (key) => {
        this._hoveredVar = key;
        if (this._linkedEq) {
          this._linkedEq.setHighlightedVar(key);
        }
      },

      onControlChange: (cb) => {
        if (typeof cb !== 'function') return () => {};
        this._controlListeners.add(cb);
        return () => this._controlListeners.delete(cb);
      },

      onBreakToggle: (cb) => {
        if (typeof cb !== 'function') return () => {};
        this._breakListeners.add(cb);
        return () => this._breakListeners.delete(cb);
      },

      onHoverVar: (cb) => {
        if (typeof cb !== 'function') return () => {};
        this._hoverListeners.add(cb);
        return () => this._hoverListeners.delete(cb);
      },

      onReset: (cb) => {
        if (typeof cb !== 'function') return () => {};
        this._resetListeners.add(cb);
        return () => this._resetListeners.delete(cb);
      },
    };
  }

  /**
   * Cleanly tear down canvas engine, LinkedEquationBar, and all DOM listeners.
   */
  dispose() {
    if (this._labCleanup) {
      try {
        if (typeof this._labCleanup === 'function') {
          this._labCleanup();
        } else if (typeof this._labCleanup.dispose === 'function') {
          this._labCleanup.dispose();
        }
      } catch (err) {
        console.error('[FrontierLessonShell] lab cleanup error:', err);
      }
      this._labCleanup = null;
    }

    if (this._linkedEq) {
      try {
        this._linkedEq.dispose();
      } catch {
        // Ignore
      }
      this._linkedEq = null;
    }

    for (const fn of this._cleanups) {
      try {
        fn();
      } catch {
        // Ignore
      }
    }
    this._cleanups = [];

    this._telemetryRefs.clear();
    this._controlRefs.clear();
    this._controlListeners.clear();
    this._breakListeners.clear();
    this._hoverListeners.clear();
    this._resetListeners.clear();

    if (this._container && this._root && this._root.parentNode === this._container) {
      this._container.removeChild(this._root);
    }

    this._container = null;
    this._root = null;
    this._labModule = null;
    this._options = {};
    this._controlValues = {};
    this._initialControlValues = {};
    this._viewportFrameEl = null;
    this._statusPillEl = null;
    this._statusDotEl = null;
    this._statusTextEl = null;
    this._chromeBreakBtn = null;
    this._drawerBreakBtn = null;
    this._stepButtons = [];
    this._stepPanes = [];
    this._prevBtn = null;
    this._nextBtn = null;
    this._stepCounterEl = null;
    this._lastStatusKey = '';
  }
}

export default FrontierLessonShell;
