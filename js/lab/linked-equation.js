/**
 * EIGENLAB — Interactive Live Linked-Equation Bar
 * Bidirectional bridge between mathematical notation and live 2D/3D canvas geometry.
 * Designed for 60 FPS updates with zero innerHTML thrashing.
 */

import { renderKatex, sound } from '../store.js';

const COLOR_TOKENS = Object.freeze({
  cyan: {
    hex: '#00E5FF',
    rgb: '0, 229, 255',
    bg: 'rgba(0, 229, 255, 0.09)',
    bgActive: 'rgba(0, 229, 255, 0.22)',
    border: 'rgba(0, 229, 255, 0.34)',
    borderActive: 'rgba(0, 229, 255, 0.9)',
    text: '#80F2FF',
  },
  emerald: {
    hex: '#00E676',
    rgb: '0, 230, 118',
    bg: 'rgba(0, 230, 118, 0.09)',
    bgActive: 'rgba(0, 230, 118, 0.22)',
    border: 'rgba(0, 230, 118, 0.34)',
    borderActive: 'rgba(0, 230, 118, 0.9)',
    text: '#86F7BC',
  },
  amber: {
    hex: '#FFB300',
    rgb: '255, 179, 0',
    bg: 'rgba(255, 179, 0, 0.09)',
    bgActive: 'rgba(255, 179, 0, 0.22)',
    border: 'rgba(255, 179, 0, 0.36)',
    borderActive: 'rgba(255, 179, 0, 0.92)',
    text: '#FFD875',
  },
  crimson: {
    hex: '#FF1744',
    rgb: '255, 23, 68',
    bg: 'rgba(255, 23, 68, 0.10)',
    bgActive: 'rgba(255, 23, 68, 0.25)',
    border: 'rgba(255, 23, 68, 0.40)',
    borderActive: 'rgba(255, 23, 68, 0.95)',
    text: '#FF8096',
  },
  violet: {
    hex: '#A78BFA',
    rgb: '167, 139, 250',
    bg: 'rgba(167, 139, 250, 0.10)',
    bgActive: 'rgba(167, 139, 250, 0.24)',
    border: 'rgba(167, 139, 250, 0.36)',
    borderActive: 'rgba(167, 139, 250, 0.92)',
    text: '#D4C4FD',
  },
});

const STYLE_ELEMENT_ID = 'eigenlab-linked-eq-styles';

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    .el-eq-bar {
      background: linear-gradient(180deg, rgba(28, 31, 38, 0.92) 0%, rgba(16, 19, 26, 0.96) 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 28px -14px rgba(0, 0, 0, 0.75);
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 100%;
    }
    .el-eq-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .el-eq-caption {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #8A95AD;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .el-eq-hint {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 11px;
      color: #7D89A3;
    }
    .el-eq-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 5px;
      min-height: 36px;
    }
    .el-eq-op {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 14px;
      font-weight: 500;
      color: #9BA7C0;
      padding: 0 2px;
      user-select: none;
      line-height: 1;
    }
    .el-eq-pill {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 9px;
      border: 1px solid var(--eq-border);
      background: var(--eq-bg);
      color: #F3F6FC;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1),
                  background-color 0.15s ease,
                  border-color 0.15s ease,
                  box-shadow 0.15s ease;
    }
    .el-eq-pill:hover,
    .el-eq-pill[data-active="true"] {
      background: var(--eq-bg-active);
      border-color: var(--eq-border-active);
      box-shadow: 0 0 0 1px rgba(var(--eq-rgb), 0.4), 0 0 18px -4px rgba(var(--eq-rgb), 0.65);
      transform: translateY(-1px);
    }
    .el-eq-pill[data-pinned="true"]::after {
      content: "";
      position: absolute;
      top: -3px;
      right: -3px;
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background: var(--eq-hex);
      box-shadow: 0 0 8px var(--eq-hex);
      border: 1px solid #0A0C10;
    }
    .el-eq-pill:focus-visible {
      outline: 2px solid var(--eq-hex);
      outline-offset: 2px;
    }
    .el-eq-sym {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--eq-text);
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }
    .el-eq-sym .katex {
      font-size: 0.96em;
      color: inherit;
    }
    .el-eq-divider {
      width: 1px;
      height: 13px;
      background: rgba(255, 255, 255, 0.14);
      flex-shrink: 0;
    }
    .el-eq-val-wrap {
      display: inline-flex;
      align-items: baseline;
      gap: 2px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .el-eq-val {
      font-size: 12px;
      font-weight: 600;
      color: #F8FAFC;
    }
    .el-eq-unit {
      font-size: 10px;
      color: #8C98B2;
    }
    .el-eq-tooltip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 9px;
      background: rgba(10, 12, 16, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11.5px;
      line-height: 1.4;
      color: #CBD5E1;
      min-height: 30px;
      transition: border-color 0.15s ease;
    }
    .el-eq-tooltip-dot {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      flex-shrink: 0;
      background: #64748B;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .el-eq-tooltip-text {
      flex: 1;
      min-width: 0;
    }
    .el-eq-tooltip-clear {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #94A3B8;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 2px 6px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .el-eq-tooltip-clear:hover {
      color: #F8FAFC;
      background: rgba(255, 255, 255, 0.12);
    }
    @media (max-width: 640px) {
      .el-eq-bar {
        padding: 9px 10px;
      }
      .el-eq-pill {
        padding: 4px 7px;
        gap: 5px;
      }
      .el-eq-sym {
        font-size: 12px;
      }
      .el-eq-val {
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);
}

function getToken(colorName) {
  return COLOR_TOKENS[colorName] || COLOR_TOKENS.cyan;
}

function formatNumericValue(raw, part) {
  if (raw == null) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return raw > 0 ? '+∞' : raw < 0 ? '-∞' : 'NaN';
    if (part && typeof part.format === 'function') {
      try {
        return String(part.format(raw));
      } catch {
        // Fall through to default formatting
      }
    }
    if (part && Number.isInteger(part.decimals)) {
      return raw.toFixed(part.decimals);
    }
    const abs = Math.abs(raw);
    if (abs === 0) return '0.00';
    if (abs >= 1000) return raw.toFixed(0);
    if (abs >= 100) return raw.toFixed(1);
    if (abs >= 10) return raw.toFixed(2);
    if (abs < 0.001) return raw.toExponential(1);
    return raw.toFixed(2);
  }
  return String(raw);
}

function applyTokenVars(el, token) {
  el.style.setProperty('--eq-hex', token.hex);
  el.style.setProperty('--eq-rgb', token.rgb);
  el.style.setProperty('--eq-bg', token.bg);
  el.style.setProperty('--eq-bg-active', token.bgActive);
  el.style.setProperty('--eq-border', token.border);
  el.style.setProperty('--eq-border-active', token.borderActive);
  el.style.setProperty('--eq-text', token.text);
}

function renderSymbolContent(el, symbol) {
  const str = symbol == null ? '' : String(symbol);
  if (/[\\^_{}]/.test(str)) {
    renderKatex(el, str, false);
  } else {
    el.textContent = str;
  }
}

export class LinkedEquationBar {
  constructor(container = null, spec = null, options = null) {
    this._container = null;
    this._root = null;
    this._spec = null;
    this._options = {};
    /** @type {Map<string, Array<{ pillEl: HTMLButtonElement, valEl: HTMLSpanElement, unitEl: HTMLSpanElement|null, part: object, lastText: string, lastColor: string }>>} */
    this._varRefs = new Map();
    this._cleanups = [];
    this._activeKey = null;
    this._pinnedKey = null;
    this._tooltipEl = null;
    this._tooltipDot = null;
    this._tooltipText = null;
    this._tooltipClearBtn = null;

    if (container && spec) {
      this.mount(container, spec, options || {});
    }
  }

  /**
   * Mount interactive linked-equation bar into a DOM container.
   * @param {HTMLElement} container
   * @param {{ caption?: string, parts: Array<object> }} spec
   * @param {{ onHoverVar?: (key: string | null) => void }} [options]
   */
  mount(container, spec, options = {}) {
    this.dispose();
    if (!container || !spec) return this;

    ensureStyles();

    this._container = container;
    this._spec = spec;
    this._options = options || {};
    this._varRefs.clear();
    this._activeKey = null;
    this._pinnedKey = null;

    const root = document.createElement('div');
    root.className = 'el-eq-bar';
    root.setAttribute('data-linked-equation', 'true');

    // Header row with optional formula caption and interaction cue
    const header = document.createElement('div');
    header.className = 'el-eq-header';

    const captionEl = document.createElement('div');
    captionEl.className = 'el-eq-caption';
    const pulseDot = document.createElement('span');
    pulseDot.style.cssText =
      'width:6px;height:6px;border-radius:9999px;background:#00E5FF;box-shadow:0 0 8px #00E5FF;display:inline-block;';
    captionEl.appendChild(pulseDot);
    const captionText = document.createElement('span');
    captionText.textContent = spec.caption || 'LIVE LINKED EQUATION';
    captionEl.appendChild(captionText);
    header.appendChild(captionEl);

    const hintEl = document.createElement('span');
    hintEl.className = 'el-eq-hint';
    hintEl.textContent = 'Hover or tap any variable to highlight geometry';
    header.appendChild(hintEl);

    root.appendChild(header);

    // Equation token flow row
    const row = document.createElement('div');
    row.className = 'el-eq-row';

    const parts = Array.isArray(spec.parts) ? spec.parts : [];
    for (const part of parts) {
      if (!part) continue;

      if (part.type === 'var' && part.key) {
        const token = getToken(part.color);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'el-eq-pill';
        pill.setAttribute('data-eq-var', part.key);
        pill.setAttribute('data-active', 'false');
        pill.setAttribute('data-pinned', 'false');
        if (part.tooltip) {
          pill.title = part.tooltip;
          pill.setAttribute('aria-label', `${part.symbol || part.key}: ${part.tooltip}`);
        }
        applyTokenVars(pill, token);

        const symEl = document.createElement('span');
        symEl.className = 'el-eq-sym';
        renderSymbolContent(symEl, part.symbol != null ? part.symbol : part.key);
        pill.appendChild(symEl);

        const hasReadout = part.showValue !== false;
        let valEl = null;
        let unitEl = null;

        if (hasReadout) {
          const divider = document.createElement('span');
          divider.className = 'el-eq-divider';
          pill.appendChild(divider);

          const valWrap = document.createElement('span');
          valWrap.className = 'el-eq-val-wrap';

          valEl = document.createElement('span');
          valEl.className = 'el-eq-val';
          const initialText = formatNumericValue(
            part.initialValue !== undefined ? part.initialValue : 0,
            part
          );
          valEl.textContent = initialText;
          valWrap.appendChild(valEl);

          if (part.unit) {
            unitEl = document.createElement('span');
            unitEl.className = 'el-eq-unit';
            unitEl.textContent = part.unit;
            valWrap.appendChild(unitEl);
          }

          pill.appendChild(valWrap);
        }

        const key = part.key;
        const onPointerEnter = (ev) => {
          if (ev.pointerType === 'touch') return;
          this._applyHighlight(key, true);
        };
        const onPointerLeave = (ev) => {
          if (ev.pointerType === 'touch') return;
          this._applyHighlight(this._pinnedKey, true);
        };
        const onFocus = () => {
          this._applyHighlight(key, true);
        };
        const onBlur = () => {
          this._applyHighlight(this._pinnedKey, true);
        };
        const onClick = (ev) => {
          ev.preventDefault();
          sound.playTick();
          if (this._pinnedKey === key) {
            this._pinnedKey = null;
            this._applyHighlight(null, true);
          } else {
            this._pinnedKey = key;
            this._applyHighlight(key, true);
          }
          this._syncPinnedMarkers();
        };

        pill.addEventListener('pointerenter', onPointerEnter);
        pill.addEventListener('pointerleave', onPointerLeave);
        pill.addEventListener('focus', onFocus);
        pill.addEventListener('blur', onBlur);
        pill.addEventListener('click', onClick);

        this._cleanups.push(() => {
          pill.removeEventListener('pointerenter', onPointerEnter);
          pill.removeEventListener('pointerleave', onPointerLeave);
          pill.removeEventListener('focus', onFocus);
          pill.removeEventListener('blur', onBlur);
          pill.removeEventListener('click', onClick);
        });

        const list = this._varRefs.get(key) || [];
        list.push({
          pillEl: pill,
          valEl,
          unitEl,
          part,
          lastText: valEl ? valEl.textContent : '',
          lastColor: part.color || 'cyan',
        });
        this._varRefs.set(key, list);

        row.appendChild(pill);
      } else {
        const opEl = document.createElement('span');
        opEl.className = 'el-eq-op';
        const opText = part.text != null ? String(part.text) : '';
        if (/[\\^_{}]/.test(opText)) {
          renderKatex(opEl, opText, false);
        } else {
          opEl.textContent = opText;
        }
        row.appendChild(opEl);
      }
    }

    root.appendChild(row);

    // Compact live tooltip inspector bar (always zero-overflow, works cleanly on mobile)
    const tooltipBar = document.createElement('div');
    tooltipBar.className = 'el-eq-tooltip';

    const dot = document.createElement('span');
    dot.className = 'el-eq-tooltip-dot';
    tooltipBar.appendChild(dot);

    const tipText = document.createElement('span');
    tipText.className = 'el-eq-tooltip-text';
    tipText.textContent = 'Select a highlighted symbol above to inspect its physical role on the canvas.';
    tooltipBar.appendChild(tipText);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'el-eq-tooltip-clear';
    clearBtn.textContent = 'Unpin';
    clearBtn.style.display = 'none';
    const onClear = () => {
      this._pinnedKey = null;
      this._syncPinnedMarkers();
      this._applyHighlight(null, true);
    };
    clearBtn.addEventListener('click', onClear);
    this._cleanups.push(() => clearBtn.removeEventListener('click', onClear));
    tooltipBar.appendChild(clearBtn);

    root.appendChild(tooltipBar);

    this._tooltipEl = tooltipBar;
    this._tooltipDot = dot;
    this._tooltipText = tipText;
    this._tooltipClearBtn = clearBtn;
    this._root = root;

    container.textContent = '';
    container.appendChild(root);

    return this;
  }

  /**
   * 60 FPS safe direct textContent update for equation variables.
   * Accepts { [key]: number | string | { value, color?, unit? } }.
   * @param {Record<string, any>} valueMap
   */
  updateValues(valueMap) {
    if (!valueMap || typeof valueMap !== 'object' || this._varRefs.size === 0) return;

    for (const key of Object.keys(valueMap)) {
      const entries = this._varRefs.get(key);
      if (!entries) continue;

      const rawEntry = valueMap[key];
      const isObj = rawEntry !== null && typeof rawEntry === 'object' && !Array.isArray(rawEntry);
      const rawVal = isObj ? rawEntry.value : rawEntry;
      const colorOverride = isObj && typeof rawEntry.color === 'string' ? rawEntry.color : null;
      const unitOverride = isObj && typeof rawEntry.unit === 'string' ? rawEntry.unit : null;

      for (let i = 0; i < entries.length; i++) {
        const ref = entries[i];
        if (ref.valEl) {
          const nextText = formatNumericValue(rawVal, ref.part);
          if (nextText !== ref.lastText) {
            ref.valEl.textContent = nextText;
            ref.lastText = nextText;
          }
        }
        if (unitOverride !== null && ref.unitEl && ref.unitEl.textContent !== unitOverride) {
          ref.unitEl.textContent = unitOverride;
        }
        if (colorOverride && colorOverride !== ref.lastColor) {
          applyTokenVars(ref.pillEl, getToken(colorOverride));
          ref.lastColor = colorOverride;
        }
      }
    }
  }

  /**
   * Programmatically highlight a variable pill (e.g., from canvas raycast/hover).
   * Does not re-trigger onHoverVar to avoid feedback loops.
   * @param {string | null} key
   */
  setHighlightedVar(key) {
    const normalized = typeof key === 'string' && this._varRefs.has(key) ? key : null;
    this._applyHighlight(normalized, false);
  }

  _syncPinnedMarkers() {
    for (const [k, entries] of this._varRefs.entries()) {
      const pinned = k === this._pinnedKey ? 'true' : 'false';
      for (const ref of entries) {
        ref.pillEl.setAttribute('data-pinned', pinned);
      }
    }
    if (this._tooltipClearBtn) {
      this._tooltipClearBtn.style.display = this._pinnedKey ? 'inline-block' : 'none';
    }
  }

  _applyHighlight(key, notifyCallback) {
    const nextKey = typeof key === 'string' && this._varRefs.has(key) ? key : null;
    const changed = nextKey !== this._activeKey;
    this._activeKey = nextKey;

    for (const [k, entries] of this._varRefs.entries()) {
      const isActive = k === nextKey;
      for (const ref of entries) {
        ref.pillEl.setAttribute('data-active', isActive ? 'true' : 'false');
      }
    }

    if (this._tooltipText && this._tooltipDot && this._tooltipEl) {
      if (nextKey) {
        const firstRef = this._varRefs.get(nextKey)[0];
        const token = getToken(firstRef.lastColor || firstRef.part.color);
        this._tooltipDot.style.backgroundColor = token.hex;
        this._tooltipDot.style.boxShadow = `0 0 10px ${token.hex}`;
        this._tooltipEl.style.borderColor = `rgba(${token.rgb}, 0.42)`;
        const label = firstRef.part.label || firstRef.part.symbol || nextKey;
        const tip = firstRef.part.tooltip || 'Highlighted directly in the interactive simulation.';
        this._tooltipText.textContent = `${label} — ${tip}`;
      } else {
        this._tooltipDot.style.backgroundColor = '#64748B';
        this._tooltipDot.style.boxShadow = 'none';
        this._tooltipEl.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        this._tooltipText.textContent =
          'Select a highlighted symbol above to inspect its physical role on the canvas.';
      }
    }

    if (notifyCallback && changed && typeof this._options.onHoverVar === 'function') {
      try {
        this._options.onHoverVar(nextKey);
      } catch (err) {
        console.error('[LinkedEquationBar] onHoverVar error:', err);
      }
    }
  }

  /**
   * Clean up listeners and DOM references.
   */
  dispose() {
    for (const fn of this._cleanups) {
      try {
        fn();
      } catch {
        // Ignore cleanup errors
      }
    }
    this._cleanups = [];
    this._varRefs.clear();
    if (this._container && this._root && this._root.parentNode === this._container) {
      this._container.removeChild(this._root);
    }
    this._container = null;
    this._root = null;
    this._spec = null;
    this._options = {};
    this._activeKey = null;
    this._pinnedKey = null;
    this._tooltipEl = null;
    this._tooltipDot = null;
    this._tooltipText = null;
    this._tooltipClearBtn = null;
  }
}

export default LinkedEquationBar;
