/**
 * EIGENLAB — Interactive Two-Tier Physical AI DAG Skill Graph
 * Visualizes Tier 1 (Pruned Invariant Foundations, F1–F8) -> Tier 2 (Physical AI Frontier, M1–M5)
 * with instant causal upstream/downstream chain highlighting and Selected Node Inspector.
 */

import {
  DAG_TRACKS,
  DAG_NODES,
  getDagNode,
  getDagTrack,
  getUpstreamChain,
  getDownstreamChain,
  getDirectUnlocks,
  getDagEdges,
  getDagSummary,
} from '../data/dag-curriculum.js';
import { sound, renderKatex } from '../store.js';
import { getFrontierCompletedIds } from '../lab/frontier-shell.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const STYLE_ELEMENT_ID = 'eigenlab-curriculum-graph-styles';

const FLAGSHIP_QUICK_IDS = ['F1.1', 'F1.2', 'M1.1', 'M4.1'];

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) {
      el.setAttribute(k, String(v));
    }
  }
  return el;
}

function wrapTwoLines(text, maxChars = 15) {
  const clean = String(text || '').trim();
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(/\s+/);
  let line1 = '';
  let idx = 0;
  while (idx < words.length) {
    const candidate = line1 ? `${line1} ${words[idx]}` : words[idx];
    if (candidate.length <= maxChars || !line1) {
      line1 = candidate;
      idx += 1;
    } else {
      break;
    }
  }
  if (idx >= words.length) return [line1.slice(0, maxChars)];
  let line2 = words.slice(idx).join(' ');
  if (line2.length > maxChars) {
    line2 = `${line2.slice(0, maxChars - 1).trim()}…`;
  }
  return [line1, line2];
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    .el-dag-root {
      width: 100%;
      max-width: 1480px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #F3F6FC;
    }

    .el-dag-quickbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 12px;
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(28, 31, 38, 0.9) 0%, rgba(16, 19, 26, 0.94) 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .el-dag-quick-label {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #00E5FF;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-right: 4px;
      white-space: nowrap;
    }

    .el-dag-quick-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 11px;
      border-radius: 9999px;
      border: 1px solid rgba(0, 229, 255, 0.34);
      background: rgba(0, 229, 255, 0.09);
      color: #ECFEFF;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
    }

    .el-dag-quick-pill:hover {
      transform: translateY(-1px);
      border-color: rgba(0, 229, 255, 0.82);
      background: rgba(0, 229, 255, 0.18);
      box-shadow: 0 0 18px -5px rgba(0, 229, 255, 0.6);
    }

    .el-dag-quick-pill[data-completed="true"] {
      border-color: rgba(0, 230, 118, 0.55);
      background: rgba(0, 230, 118, 0.12);
    }

    .el-dag-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 10px 12px;
      border-radius: 14px;
      background: #1C1F26;
      border: 1px solid rgba(255, 255, 255, 0.09);
    }

    .el-dag-filters {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .el-dag-filter-btn {
      padding: 6px 11px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(10, 12, 16, 0.55);
      color: #9AA7C0;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.16s ease;
    }

    .el-dag-filter-btn:hover {
      color: #F8FAFC;
      border-color: rgba(255, 255, 255, 0.22);
    }

    .el-dag-filter-btn[data-active="true"] {
      color: #ECFEFF;
      background: rgba(0, 229, 255, 0.16);
      border-color: rgba(0, 229, 255, 0.65);
      box-shadow: 0 0 14px -5px rgba(0, 229, 255, 0.55);
    }

    .el-dag-search-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .el-dag-search {
      width: 195px;
      max-width: 100%;
      padding: 6px 11px;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.11);
      background: #0A0C10;
      color: #F3F6FC;
      font-size: 12px;
      outline: none;
      transition: border-color 0.16s ease;
    }

    .el-dag-search:focus {
      border-color: rgba(0, 229, 255, 0.65);
    }

    .el-dag-legend {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      color: #94A3B8;
    }

    .el-dag-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    .el-dag-legend-dot {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      display: inline-block;
    }

    .el-dag-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }

    @media (min-width: 1024px) {
      .el-dag-layout {
        grid-template-columns: minmax(0, 1fr) 356px;
        gap: 16px;
      }
    }

    .el-dag-canvas-card {
      min-width: 0;
      background: #0A0C10;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 22px 50px -22px rgba(0, 0, 0, 0.85);
    }

    .el-dag-scroll-wrap {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      padding: 8px 6px 10px;
      background-image:
        radial-gradient(circle at 22% 18%, rgba(0, 229, 255, 0.06), transparent 52%),
        radial-gradient(circle at 82% 24%, rgba(167, 139, 250, 0.06), transparent 54%),
        linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
      background-size: auto, auto, 32px 32px, 32px 32px;
    }

    .el-dag-svg {
      display: block;
      width: 100%;
      min-width: 780px;
      height: auto;
      user-select: none;
    }

    .el-dag-mobile-hint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      color: #7D89A3;
      background: rgba(28, 31, 38, 0.55);
    }

    @media (min-width: 1024px) {
      .el-dag-mobile-hint-scroll {
        display: none;
      }
    }

    /* SVG Edge States */
    .el-dag-edge {
      fill: none;
      stroke: rgba(148, 163, 184, 0.22);
      stroke-width: 1.35;
      transition: stroke 0.16s ease, stroke-width 0.16s ease, opacity 0.16s ease;
    }
    .el-dag-edge[data-cross="true"] {
      stroke: rgba(0, 229, 255, 0.22);
    }
    .el-dag-edge[data-state="dim"] {
      opacity: 0.07;
    }
    .el-dag-edge[data-state="upstream"] {
      stroke: #FFB300;
      stroke-width: 2.35;
      opacity: 0.96;
      filter: drop-shadow(0 0 5px rgba(255, 179, 0, 0.65));
    }
    .el-dag-edge[data-state="downstream"] {
      stroke: #00E676;
      stroke-width: 2.35;
      opacity: 0.96;
      filter: drop-shadow(0 0 5px rgba(0, 230, 118, 0.65));
    }

    /* SVG Node States */
    .el-dag-node {
      cursor: pointer;
      transition: opacity 0.16s ease;
    }
    .el-dag-node-bg {
      fill: #161922;
      stroke: rgba(255, 255, 255, 0.11);
      stroke-width: 1.15;
      transition: fill 0.16s ease, stroke 0.16s ease, stroke-width 0.16s ease;
    }
    .el-dag-node[data-status="implemented"] .el-dag-node-bg {
      fill: #1A202D;
      stroke: rgba(0, 229, 255, 0.36);
    }
    .el-dag-node[data-completed="true"] .el-dag-node-bg {
      stroke: rgba(0, 230, 118, 0.52);
    }
    .el-dag-node:hover .el-dag-node-bg {
      fill: #1E2534;
      stroke: rgba(0, 229, 255, 0.8);
    }
    .el-dag-node[data-state="dim"] {
      opacity: 0.28;
    }
    .el-dag-node[data-filtered="out"] {
      opacity: 0.14;
    }
    .el-dag-node[data-state="active"] .el-dag-node-bg {
      fill: #142634;
      stroke: #00E5FF;
      stroke-width: 2.1;
      filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));
    }
    .el-dag-node[data-state="upstream"] .el-dag-node-bg {
      fill: #272013;
      stroke: #FFB300;
      stroke-width: 1.85;
      filter: drop-shadow(0 0 6px rgba(255, 179, 0, 0.5));
    }
    .el-dag-node[data-state="downstream"] .el-dag-node-bg {
      fill: #12261F;
      stroke: #00E676;
      stroke-width: 1.85;
      filter: drop-shadow(0 0 6px rgba(0, 230, 118, 0.5));
    }

    /* Inspector Panel */
    .el-dag-inspector {
      background: #1C1F26;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 13px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 20px 44px -18px rgba(0, 0, 0, 0.78);
      min-width: 0;
    }

    @media (min-width: 1024px) {
      .el-dag-inspector {
        position: sticky;
        top: 16px;
      }
    }

    .el-dag-chip-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(10, 12, 16, 0.72);
      color: #E2E8F0;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .el-dag-chip-pill:hover {
      border-color: rgba(0, 229, 255, 0.65);
      background: rgba(0, 229, 255, 0.12);
      transform: translateY(-1px);
    }

    @media (max-width: 640px) {
      .el-dag-search {
        width: 100%;
      }
      .el-dag-inspector {
        padding: 14px;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Compute deterministic layered coordinates for Tier 1 (left, 8 tracks) and Tier 2 (right, 5 tracks).
 */
function computeLayout() {
  const width = 960;
  const height = 746;

  const tier1Tracks = DAG_TRACKS.filter((t) => t.tier === 1).sort((a, b) => a.order - b.order);
  const tier2Tracks = DAG_TRACKS.filter((t) => t.tier === 2).sort((a, b) => a.order - b.order);

  const nodePositions = new Map();
  const trackHeaders = [];

  // Tier 1: Left 8 rows
  const t1StartY = 58;
  const t1PitchY = 85;
  const t1NodeW = 96;
  const t1NodeH = 54;
  const t1StartX = 128;
  const t1StepX = 104;

  tier1Tracks.forEach((track, rowIdx) => {
    const y = t1StartY + rowIdx * t1PitchY;
    trackHeaders.push({
      track,
      x: 14,
      y: y + 4,
      width: 106,
      height: t1NodeH - 8,
      tier: 1,
    });

    const nodes = DAG_NODES.filter((n) => n.trackId === track.id);
    nodes.forEach((node, colIdx) => {
      const x = t1StartX + colIdx * t1StepX;
      nodePositions.set(node.id, {
        x,
        y,
        w: t1NodeW,
        h: t1NodeH,
        cx: x + t1NodeW / 2,
        cy: y + t1NodeH / 2,
        leftX: x,
        rightX: x + t1NodeW,
        tier: 1,
        rowIdx,
        colIdx,
      });
    });
  });

  // Tier 2: Right 5 rows, evenly spaced across the full vertical span
  const t2StartY = 84;
  const t2PitchY = 132;
  const t2NodeW = 96;
  const t2NodeH = 58;
  const t2StartX = 634;
  const t2StepX = 104;

  tier2Tracks.forEach((track, rowIdx) => {
    const y = t2StartY + rowIdx * t2PitchY;
    trackHeaders.push({
      track,
      x: t2StartX,
      y: y - 24,
      width: 304,
      height: 18,
      tier: 2,
    });

    const nodes = DAG_NODES.filter((n) => n.trackId === track.id);
    nodes.forEach((node, colIdx) => {
      const x = t2StartX + colIdx * t2StepX;
      nodePositions.set(node.id, {
        x,
        y,
        w: t2NodeW,
        h: t2NodeH,
        cx: x + t2NodeW / 2,
        cy: y + t2NodeH / 2,
        leftX: x,
        rightX: x + t2NodeW,
        tier: 2,
        rowIdx,
        colIdx,
      });
    });
  });

  return { width, height, nodePositions, trackHeaders };
}

function buildEdgePath(fromPos, toPos, isCrossTier) {
  if (isCrossTier) {
    const x1 = fromPos.rightX;
    const y1 = fromPos.cy;
    const x2 = toPos.leftX;
    const y2 = toPos.cy;
    const dx = Math.max(46, (x2 - x1) * 0.48);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  // Same track, left-to-right adjacent or skip
  if (fromPos.rowIdx === toPos.rowIdx && fromPos.tier === toPos.tier) {
    if (toPos.colIdx === fromPos.colIdx + 1) {
      const x1 = fromPos.rightX;
      const y1 = fromPos.cy;
      const x2 = toPos.leftX;
      const y2 = toPos.cy;
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    }
    // Same row skip: gentle arc over the top of intermediate node
    const x1 = fromPos.cx;
    const y1 = fromPos.y;
    const x2 = toPos.cx;
    const y2 = toPos.y;
    const archY = Math.min(y1, y2) - 20;
    return `M ${x1} ${y1} C ${x1} ${archY}, ${x2} ${archY}, ${x2} ${y2}`;
  }

  // Cross-track within same tier
  const x1 = fromPos.cx;
  const y1 = fromPos.y + (toPos.cy > fromPos.cy ? fromPos.h : 0);
  const x2 = toPos.cx;
  const y2 = toPos.y + (toPos.cy > fromPos.cy ? 0 : toPos.h);
  const midY = (y1 + y2) / 2;
  const bendX = fromPos.colIdx === toPos.colIdx ? 18 : 0;
  return `M ${x1} ${y1} C ${x1 + bendX} ${midY}, ${x2 + bendX} ${midY}, ${x2} ${y2}`;
}

export class CurriculumSkillGraph {
  constructor() {
    this._container = null;
    this._root = null;
    this._options = {};
    this._cleanups = [];

    this._completedIds = new Set();
    this._activeFilter = 'all';
    this._searchQuery = '';
    this._selectedNodeId = 'F1.2';
    this._hoveredNodeId = null;

    /** @type {Map<string, { group: SVGGElement, doneDot: SVGCircleElement }>} */
    this._nodeEls = new Map();
    /** @type {Array<{ edge: object, pathEl: SVGPathElement }>} */
    this._edgeEls = [];
    this._filterButtons = new Map();
    this._quickPillEls = new Map();
    this._inspectorEl = null;
  }

  /**
   * Mount interactive Two-Tier Curriculum Skill Graph.
   * @param {HTMLElement} container
   * @param {{ onLaunchNode?: (nodeId: string) => void, completedIds?: string[] | Set<string> }} [options]
   */
  mount(container, options = {}) {
    this.dispose();
    if (!container) return this;

    ensureStyles();

    this._container = container;
    this._options = options || {};
    this._activeFilter = 'all';
    this._searchQuery = '';
    this._hoveredNodeId = null;

    // Seed completed IDs from options + localStorage
    this._completedIds = new Set(getFrontierCompletedIds());
    if (options && options.completedIds) {
      for (const id of options.completedIds) {
        if (typeof id === 'string' && id) this._completedIds.add(id);
      }
    }

    const summary = getDagSummary();
    if (!getDagNode(this._selectedNodeId)) {
      this._selectedNodeId =
        (summary.flagshipIds && summary.flagshipIds[0]) ||
        (DAG_NODES[0] && DAG_NODES[0].id) ||
        '';
    }

    const root = document.createElement('section');
    root.className = 'el-dag-root';
    root.setAttribute('data-curriculum-graph', 'true');

    // 1. Flagship Vertical-Slice Quick-Jump Bar (1-tap launch)
    root.appendChild(this._buildQuickJumpBar(summary));

    // 2. Filter Bar + Search + Highlight Legend
    root.appendChild(this._buildToolbar(summary));

    // 3. Main Responsive 2-Column Layout (SVG Graph + Inspector)
    const layoutGrid = document.createElement('div');
    layoutGrid.className = 'el-dag-layout';

    const canvasCard = document.createElement('div');
    canvasCard.className = 'el-dag-canvas-card';

    const hintStrip = document.createElement('div');
    hintStrip.className = 'el-dag-mobile-hint';
    hintStrip.innerHTML = `
      <span>HOVER OR TAP ANY MODULE TO TRACE CAUSAL PREREQS → FRONTIER UNLOCKS</span>
      <span class="el-dag-mobile-hint-scroll" style="color:#00E5FF;">Swipe ↔</span>
    `;
    canvasCard.appendChild(hintStrip);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'el-dag-scroll-wrap';
    scrollWrap.appendChild(this._buildSvgGraph());
    canvasCard.appendChild(scrollWrap);

    layoutGrid.appendChild(canvasCard);

    const inspector = document.createElement('aside');
    inspector.className = 'el-dag-inspector';
    inspector.setAttribute('data-dag-inspector', 'true');
    this._inspectorEl = inspector;
    layoutGrid.appendChild(inspector);

    root.appendChild(layoutGrid);

    container.textContent = '';
    container.appendChild(root);
    this._root = root;

    this._applyVisualStates();
    this._renderInspector();

    return this;
  }

  _buildQuickJumpBar(summary) {
    const bar = document.createElement('div');
    bar.className = 'el-dag-quickbar';

    const label = document.createElement('span');
    label.className = 'el-dag-quick-label';
    label.innerHTML =
      '<span style="width:7px;height:7px;border-radius:9999px;background:#00E5FF;box-shadow:0 0 8px #00E5FF;display:inline-block;"></span><span>FLAGSHIP LABS</span>';
    bar.appendChild(label);

    const quickIds = [...new Set([...FLAGSHIP_QUICK_IDS, ...(summary.flagshipIds || [])])].filter(
      (id) => Boolean(getDagNode(id))
    );

    for (const id of quickIds) {
      const node = getDagNode(id);
      if (!node) continue;
      const done = this._completedIds.has(id);

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'el-dag-quick-pill';
      pill.setAttribute('data-quick-node', id);
      pill.setAttribute('data-completed', done ? 'true' : 'false');
      pill.innerHTML = `
        <span data-quick-id style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${done ? '#00E676' : '#00E5FF'};">${escapeHtml(node.id)}</span>
        <span>${escapeHtml(node.shortTitle || node.title)}</span>
        <span data-quick-badge style="font-family:'JetBrains Mono',monospace;font-size:9.5px;padding:1px 6px;border-radius:9999px;background:${done ? 'rgba(0,230,118,0.2)' : 'rgba(0,229,255,0.2)'};color:${done ? '#86F7BC' : '#80F2FF'};">${done ? '✓' : 'LIVE →'}</span>
      `;

      const onClick = () => {
        sound.playSnap();
        this.selectNode(id);
        if (typeof this._options.onLaunchNode === 'function') {
          this._options.onLaunchNode(id);
        }
      };
      pill.addEventListener('click', onClick);
      this._cleanups.push(() => pill.removeEventListener('click', onClick));
      this._quickPillEls.set(id, pill);
      bar.appendChild(pill);
    }

    return bar;
  }

  _buildToolbar(summary) {
    const toolbar = document.createElement('div');
    toolbar.className = 'el-dag-toolbar';

    const filters = document.createElement('div');
    filters.className = 'el-dag-filters';

    const filterDefs = [
      { id: 'all', label: `All (${summary.totalNodes})` },
      { id: 'live', label: `Live Now (${summary.implementedCount})` },
      { id: 'tier1', label: `Tier 1: Foundations (${summary.tier1Count})` },
      { id: 'tier2', label: `Tier 2: Physical AI (${summary.tier2Count})` },
    ];

    for (const f of filterDefs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'el-dag-filter-btn';
      btn.setAttribute('data-filter', f.id);
      btn.setAttribute('data-active', f.id === 'all' ? 'true' : 'false');
      btn.textContent = f.label;
      const onClick = () => {
        sound.playTick();
        this._activeFilter = f.id;
        for (const [key, b] of this._filterButtons.entries()) {
          b.setAttribute('data-active', key === f.id ? 'true' : 'false');
        }
        this._applyVisualStates();
      };
      btn.addEventListener('click', onClick);
      this._cleanups.push(() => btn.removeEventListener('click', onClick));
      this._filterButtons.set(f.id, btn);
      filters.appendChild(btn);
    }

    const rightSide = document.createElement('div');
    rightSide.className = 'el-dag-search-legend';

    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'el-dag-search';
    search.placeholder = 'Search modules or tags…';
    search.setAttribute('aria-label', 'Search skill graph modules');
    const onInput = () => {
      this._searchQuery = search.value.trim().toLowerCase();
      this._applyVisualStates();
    };
    search.addEventListener('input', onInput);
    this._cleanups.push(() => search.removeEventListener('input', onInput));
    rightSide.appendChild(search);

    const legend = document.createElement('div');
    legend.className = 'el-dag-legend';
    legend.innerHTML = `
      <span class="el-dag-legend-item"><span class="el-dag-legend-dot" style="background:#FFB300;box-shadow:0 0 6px #FFB300;"></span>Prereq Chain</span>
      <span class="el-dag-legend-item"><span class="el-dag-legend-dot" style="background:#00E5FF;box-shadow:0 0 6px #00E5FF;"></span>Active</span>
      <span class="el-dag-legend-item"><span class="el-dag-legend-dot" style="background:#00E676;box-shadow:0 0 6px #00E676;"></span>Unlocked / Mastered</span>
    `;
    rightSide.appendChild(legend);

    toolbar.appendChild(filters);
    toolbar.appendChild(rightSide);
    return toolbar;
  }

  _buildSvgGraph() {
    const { width, height, nodePositions, trackHeaders } = computeLayout();

    const svg = createSvgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'el-dag-svg',
      role: 'img',
      'aria-label': 'EIGENLAB Two-Tier Physical AI Prerequisite Skill Graph',
    });

    // Tier headers & center frontier bridge guide
    const chromeGroup = createSvgEl('g', { class: 'el-dag-chrome' });

    chromeGroup.appendChild(
      createSvgEl('text', {
        x: 18,
        y: 28,
        fill: '#80F2FF',
        'font-family': "'JetBrains Mono', monospace",
        'font-size': 11,
        'font-weight': 700,
        'letter-spacing': '0.1em',
      })
    ).textContent = 'TIER 1 · PRUNED INVARIANT FOUNDATIONS (F1–F8)';

    chromeGroup.appendChild(
      createSvgEl('text', {
        x: 634,
        y: 28,
        fill: '#D4C4FD',
        'font-family': "'JetBrains Mono', monospace",
        'font-size': 11,
        'font-weight': 700,
        'letter-spacing': '0.1em',
      })
    ).textContent = 'TIER 2 · PHYSICAL AI & ROBOTICS FRONTIER (M1–M5)';

    // Center dashed Frontier Bridge divider
    chromeGroup.appendChild(
      createSvgEl('line', {
        x1: 588,
        y1: 42,
        x2: 588,
        y2: height - 16,
        stroke: 'rgba(0, 229, 255, 0.2)',
        'stroke-width': 1,
        'stroke-dasharray': '4 5',
      })
    );

    const bridgeBadge = createSvgEl('rect', {
      x: 553,
      y: 14,
      width: 70,
      height: 18,
      rx: 9,
      fill: 'rgba(0, 229, 255, 0.1)',
      stroke: 'rgba(0, 229, 255, 0.35)',
      'stroke-width': 1,
    });
    chromeGroup.appendChild(bridgeBadge);

    const bridgeTxt = createSvgEl('text', {
      x: 588,
      y: 26,
      'text-anchor': 'middle',
      fill: '#80F2FF',
      'font-family': "'JetBrains Mono', monospace",
      'font-size': 8.5,
      'font-weight': 700,
      'letter-spacing': '0.07em',
    });
    bridgeTxt.textContent = 'BRIDGE →';
    chromeGroup.appendChild(bridgeTxt);

    // Track row labels
    for (const hdr of trackHeaders) {
      const { track, x, y, width: hw, height: hh, tier } = hdr;
      if (tier === 1) {
        chromeGroup.appendChild(
          createSvgEl('rect', {
            x,
            y,
            width: hw,
            height: hh,
            rx: 8,
            fill: 'rgba(28, 31, 38, 0.72)',
            stroke: 'rgba(255, 255, 255, 0.08)',
            'stroke-width': 1,
          })
        );
        chromeGroup.appendChild(
          createSvgEl('rect', {
            x,
            y: y + 8,
            width: 3,
            height: hh - 16,
            rx: 1.5,
            fill: track.accent || '#00E5FF',
          })
        );
        const codeEl = createSvgEl('text', {
          x: x + 10,
          y: y + 18,
          fill: track.accent || '#00E5FF',
          'font-family': "'JetBrains Mono', monospace",
          'font-size': 10,
          'font-weight': 700,
        });
        codeEl.textContent = `${track.id} · ${track.symbol || ''}`;
        chromeGroup.appendChild(codeEl);

        const nameEl = createSvgEl('text', {
          x: x + 10,
          y: y + 34,
          fill: '#CBD5E1',
          'font-family': "'Plus Jakarta Sans', sans-serif",
          'font-size': 9.8,
          'font-weight': 600,
        });
        nameEl.textContent = track.shortName || track.name;
        chromeGroup.appendChild(nameEl);
      } else {
        const lbl = createSvgEl('text', {
          x,
          y: y + 13,
          fill: track.accent || '#A78BFA',
          'font-family': "'JetBrains Mono', monospace",
          'font-size': 10,
          'font-weight': 700,
          'letter-spacing': '0.05em',
        });
        lbl.textContent = `${track.id} · ${track.shortName || track.name}`;
        chromeGroup.appendChild(lbl);
      }
    }
    svg.appendChild(chromeGroup);

    // Edges layer (rendered beneath nodes)
    const edgesGroup = createSvgEl('g', { class: 'el-dag-edges' });
    this._edgeEls = [];
    const allEdges = getDagEdges();

    for (const edge of allEdges) {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);
      if (!fromPos || !toPos) continue;

      const d = buildEdgePath(fromPos, toPos, edge.isCrossTier);
      const pathEl = createSvgEl('path', {
        d,
        class: 'el-dag-edge',
        'data-from': edge.from,
        'data-to': edge.to,
        'data-cross': edge.isCrossTier ? 'true' : 'false',
        'data-state': 'idle',
      });
      edgesGroup.appendChild(pathEl);
      this._edgeEls.push({ edge, pathEl });
    }
    svg.appendChild(edgesGroup);

    // Nodes layer
    const nodesGroup = createSvgEl('g', { class: 'el-dag-nodes' });
    this._nodeEls.clear();

    for (const node of DAG_NODES) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;
      const isLive = node.status === 'implemented';
      const isDone = this._completedIds.has(node.id);

      const g = createSvgEl('g', {
        class: 'el-dag-node',
        'data-node-id': node.id,
        'data-status': node.status,
        'data-completed': isDone ? 'true' : 'false',
        'data-state': 'idle',
        'data-filtered': 'in',
        tabindex: '0',
        role: 'button',
        'aria-label': `${node.id}: ${node.title}`,
      });

      const rect = createSvgEl('rect', {
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rx: 10,
        class: 'el-dag-node-bg',
      });
      g.appendChild(rect);

      // Module ID top-left
      const idText = createSvgEl('text', {
        x: pos.x + 8,
        y: pos.y + 15,
        fill: isLive ? '#80F2FF' : '#94A3B8',
        'font-family': "'JetBrains Mono', monospace",
        'font-size': 9.5,
        'font-weight': 700,
      });
      idText.textContent = node.id;
      g.appendChild(idText);

      // LIVE badge pill for implemented nodes
      if (isLive) {
        const pillW = node.isFlagship ? 34 : 28;
        const pillX = pos.x + pos.w - pillW - 6;
        g.appendChild(
          createSvgEl('rect', {
            x: pillX,
            y: pos.y + 5.5,
            width: pillW,
            height: 13,
            rx: 6.5,
            fill: node.isFlagship ? 'rgba(0, 229, 255, 0.24)' : 'rgba(0, 229, 255, 0.14)',
            stroke: 'rgba(0, 229, 255, 0.6)',
            'stroke-width': 0.8,
          })
        );
        const liveTxt = createSvgEl('text', {
          x: pillX + pillW / 2,
          y: pos.y + 14.5,
          'text-anchor': 'middle',
          fill: '#80F2FF',
          'font-family': "'JetBrains Mono', monospace",
          'font-size': 7.5,
          'font-weight': 700,
        });
        liveTxt.textContent = node.isFlagship ? '★LIVE' : 'LIVE';
        g.appendChild(liveTxt);
      }

      // Glowing Emerald completion dot
      const doneDot = createSvgEl('circle', {
        cx: isLive ? pos.x + pos.w - (node.isFlagship ? 45 : 39) : pos.x + pos.w - 11,
        cy: pos.y + 12,
        r: 3.6,
        fill: '#00E676',
        style: isDone
          ? 'opacity:1;filter:drop-shadow(0 0 4px #00E676);'
          : 'opacity:0;pointer-events:none;',
      });
      g.appendChild(doneDot);

      // Wrapped 1–2 line shortTitle
      const lines = wrapTwoLines(node.shortTitle || node.title, 14);
      lines.forEach((line, i) => {
        const t = createSvgEl('text', {
          x: pos.x + 8,
          y: pos.y + 30 + i * 13,
          fill: isLive ? '#F3F6FC' : '#CBD5E1',
          'font-family': "'Plus Jakarta Sans', sans-serif",
          'font-size': 10,
          'font-weight': isLive ? 600 : 500,
        });
        t.textContent = line;
        g.appendChild(t);
      });

      // Events
      const onEnter = (ev) => {
        if (ev.pointerType === 'touch') return;
        this._hoveredNodeId = node.id;
        this._applyVisualStates();
      };
      const onLeave = (ev) => {
        if (ev.pointerType === 'touch') return;
        if (this._hoveredNodeId === node.id) {
          this._hoveredNodeId = null;
          this._applyVisualStates();
        }
      };
      const onClick = () => {
        sound.playTick();
        this.selectNode(node.id);
      };
      const onKeyDown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          sound.playTick();
          this.selectNode(node.id);
        }
      };

      g.addEventListener('pointerenter', onEnter);
      g.addEventListener('pointerleave', onLeave);
      g.addEventListener('click', onClick);
      g.addEventListener('keydown', onKeyDown);

      this._cleanups.push(() => {
        g.removeEventListener('pointerenter', onEnter);
        g.removeEventListener('pointerleave', onLeave);
        g.removeEventListener('click', onClick);
        g.removeEventListener('keydown', onKeyDown);
      });

      this._nodeEls.set(node.id, { group: g, doneDot });
      nodesGroup.appendChild(g);
    }

    svg.appendChild(nodesGroup);
    return svg;
  }

  _matchesFilter(node) {
    if (this._activeFilter === 'live' && node.status !== 'implemented') return false;
    if (this._activeFilter === 'tier1' && node.tier !== 1) return false;
    if (this._activeFilter === 'tier2' && node.tier !== 2) return false;

    if (this._searchQuery) {
      const q = this._searchQuery;
      const track = getDagTrack(node.trackId);
      const haystack = [
        node.id,
        node.title,
        node.shortTitle,
        node.summary,
        track && track.name,
        track && track.shortName,
        ...(Array.isArray(node.tags) ? node.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  }

  _applyVisualStates() {
    const focusId = this._hoveredNodeId || this._selectedNodeId;
    const upstream = focusId ? getUpstreamChain(focusId) : new Set();
    const downstream = focusId ? getDownstreamChain(focusId) : new Set();

    // Update node states
    for (const node of DAG_NODES) {
      const ref = this._nodeEls.get(node.id);
      if (!ref) continue;

      const inFilter = this._matchesFilter(node);
      ref.group.setAttribute('data-filtered', inFilter ? 'in' : 'out');

      let state = 'idle';
      if (focusId) {
        if (node.id === focusId) state = 'active';
        else if (upstream.has(node.id)) state = 'upstream';
        else if (downstream.has(node.id)) state = 'downstream';
        else state = 'dim';
      }
      ref.group.setAttribute('data-state', state);

      const isDone = this._completedIds.has(node.id);
      ref.group.setAttribute('data-completed', isDone ? 'true' : 'false');
      ref.doneDot.style.opacity = isDone ? '1' : '0';
      ref.doneDot.style.filter = isDone ? 'drop-shadow(0 0 4px #00E676)' : 'none';
    }

    // Update edge states (full transitive causal chains)
    for (const { edge, pathEl } of this._edgeEls) {
      if (!focusId) {
        pathEl.setAttribute('data-state', 'idle');
        continue;
      }

      const isUpstreamEdge =
        (edge.to === focusId && upstream.has(edge.from)) ||
        (upstream.has(edge.to) && upstream.has(edge.from));

      const isDownstreamEdge =
        (edge.from === focusId && downstream.has(edge.to)) ||
        (downstream.has(edge.from) && downstream.has(edge.to));

      if (isUpstreamEdge) {
        pathEl.setAttribute('data-state', 'upstream');
      } else if (isDownstreamEdge) {
        pathEl.setAttribute('data-state', 'downstream');
      } else {
        pathEl.setAttribute('data-state', 'dim');
      }
    }
  }

  _renderInspector() {
    const el = this._inspectorEl;
    if (!el) return;

    const node = getDagNode(this._selectedNodeId);
    if (!node) {
      el.innerHTML =
        '<div style="font-size:13px;color:#94A3B8;">Select any node in the skill graph to inspect its invariants and prerequisites.</div>';
      return;
    }

    const track = getDagTrack(node.trackId);
    const isLive = node.status === 'implemented';
    const isDone = this._completedIds.has(node.id);
    const directUnlocks = getDirectUnlocks(node.id);
    const upstreamCount = getUpstreamChain(node.id).size;
    const downstreamCount = getDownstreamChain(node.id).size;

    const whyHeadline =
      (node.frontierBridge && node.frontierBridge.headline) ||
      (node.tier === 2 ? 'Frontier Physical AI Capability' : 'Why This Matters for Physical AI');
    const whyBody =
      (node.frontierBridge && node.frontierBridge.whyItMatters) ||
      (node.breakMode && node.breakMode.description) ||
      node.summary;

    const statusBadgeHtml = isDone
      ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;font-weight:700;padding:3px 8px;border-radius:9999px;background:rgba(0,230,118,0.16);border:1px solid rgba(0,230,118,0.5);color:#86F7BC;">✓ MASTERED</span>'
      : isLive
        ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;font-weight:700;padding:3px 8px;border-radius:9999px;background:rgba(0,229,255,0.16);border:1px solid rgba(0,229,255,0.5);color:#80F2FF;">● LIVE LAB</span>'
        : `<span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:3px 8px;border-radius:9999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94A3B8;">SLICE ${escapeHtml(node.slice || '2–4')}</span>`;

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;padding:4px 8px;border-radius:8px;background:rgba(0,229,255,0.14);border:1px solid rgba(0,229,255,0.45);color:#80F2FF;">${escapeHtml(node.id)}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:${escapeHtml((track && track.accent) || '#A5B0C7')};">${escapeHtml((track && track.shortName) || node.trackId)}</span>
        </div>
        ${statusBadgeHtml}
      </div>

      <div style="display:flex;flex-direction:column;gap:5px;">
        <h3 style="margin:0;font-family:'Space Grotesk',system-ui,sans-serif;font-size:18px;font-weight:700;color:#F8FAFC;line-height:1.25;">${escapeHtml(node.title)}</h3>
        <p style="margin:0;font-size:13px;line-height:1.52;color:#CBD5E1;">${escapeHtml(node.summary)}</p>
      </div>

      ${
        node.equation
          ? `<div style="padding:9px 11px;border-radius:11px;background:#0A0C10;border:1px solid rgba(255,255,255,0.08);overflow-x:auto;">
               <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:#7D89A3;margin-bottom:4px;">CORE INVARIANT</div>
               <div data-inspector-eq style="color:#E2F8FF;font-size:13px;"></div>
             </div>`
          : ''
      }

      <div style="padding:11px 12px;border-radius:12px;background:linear-gradient(160deg,rgba(0,229,255,0.1) 0%,rgba(0,230,118,0.07) 100%);border:1px solid rgba(0,229,255,0.28);display:flex;flex-direction:column;gap:4px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#80F2FF;">WHY THIS MATTERS FOR PHYSICAL AI</span>
        <span style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:13px;font-weight:700;color:#F8FAFC;">${escapeHtml(whyHeadline)}</span>
        <span style="font-size:12.5px;line-height:1.48;color:#D6E4F0;">${escapeHtml(whyBody)}</span>
      </div>

      ${
        node.breakMode && node.breakMode.title
          ? `<div style="padding:9px 11px;border-radius:11px;background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.26);display:flex;flex-direction:column;gap:3px;">
               <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#FF8096;">⚡ BREAK-THE-SYSTEM SCENARIO</span>
               <span style="font-size:12px;font-weight:600;color:#FFE4EA;">${escapeHtml(node.breakMode.title)}</span>
             </div>`
          : ''
      }

      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#FFB300;">PREREQUISITES (${node.prereqs.length} direct · ${upstreamCount} total)</span>
          <div data-prereq-chips style="display:flex;flex-wrap:wrap;gap:5px;"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#00E676;">UNLOCKS (${directUnlocks.length} direct · ${downstreamCount} downstream)</span>
          <div data-unlock-chips style="display:flex;flex-wrap:wrap;gap:5px;"></div>
        </div>
      </div>

      <div data-inspector-cta style="margin-top:2px;"></div>
    `;

    // Render KaTeX equation
    const eqEl = el.querySelector('[data-inspector-eq]');
    if (eqEl && node.equation) {
      renderKatex(eqEl, node.equation, false);
    }

    // Populate clickable prereq chips
    const prereqHost = el.querySelector('[data-prereq-chips]');
    if (prereqHost) {
      if (node.prereqs.length === 0) {
        prereqHost.innerHTML =
          '<span style="font-size:11.5px;color:#7D89A3;">Entry foundation — no prerequisites required.</span>';
      } else {
        for (const pid of node.prereqs) {
          const pNode = getDagNode(pid);
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'el-dag-chip-pill';
          chip.innerHTML = `<span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;color:#FFB300;">${escapeHtml(pid)}</span><span>${escapeHtml((pNode && pNode.shortTitle) || pid)}</span>`;
          chip.addEventListener('click', () => {
            sound.playTick();
            this.selectNode(pid);
          });
          prereqHost.appendChild(chip);
        }
      }
    }

    // Populate clickable unlock chips
    const unlockHost = el.querySelector('[data-unlock-chips]');
    if (unlockHost) {
      if (directUnlocks.length === 0) {
        unlockHost.innerHTML =
          '<span style="font-size:11.5px;color:#7D89A3;">Capstone Physical AI frontier endpoint.</span>';
      } else {
        for (const uid of directUnlocks) {
          const uNode = getDagNode(uid);
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'el-dag-chip-pill';
          chip.innerHTML = `<span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;color:#00E676;">${escapeHtml(uid)}</span><span>${escapeHtml((uNode && uNode.shortTitle) || uid)}</span>`;
          chip.addEventListener('click', () => {
            sound.playTick();
            this.selectNode(uid);
          });
          unlockHost.appendChild(chip);
        }
      }
    }

    // Launch CTA or Roadmap badge
    const ctaHost = el.querySelector('[data-inspector-cta]');
    if (ctaHost) {
      if (isLive) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-glow-cyan';
        btn.style.cssText = 'width:100%;padding:11px 16px;font-size:14px;';
        btn.setAttribute('data-launch-node', node.id);
        btn.textContent = 'Launch Interactive Lab →';
        btn.addEventListener('click', () => {
          sound.playSnap();
          if (typeof this._options.onLaunchNode === 'function') {
            this._options.onLaunchNode(node.id);
          }
        });
        ctaHost.appendChild(btn);
      } else {
        const badge = document.createElement('div');
        badge.style.cssText =
          "width:100%;text-align:center;padding:10px 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.11);background:rgba(10,12,16,0.72);font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:600;color:#94A3B8;";
        badge.textContent = `On Roadmap (Slice ${node.slice || '2–4'})`;
        ctaHost.appendChild(badge);
      }
    }
  }

  /**
   * Select a node by ID, highlight its full causal DAG chain, and update the inspector panel.
   * @param {string} nodeId
   */
  selectNode(nodeId) {
    if (!getDagNode(nodeId)) return;
    this._selectedNodeId = nodeId;
    this._hoveredNodeId = null;
    this._applyVisualStates();
    this._renderInspector();
  }

  /**
   * Refresh completed Emerald badges across the graph, quick-jump pills, and inspector.
   * @param {string[] | Set<string>} [completedIds]
   */
  refreshProgress(completedIds) {
    this._completedIds = new Set(getFrontierCompletedIds());
    if (completedIds) {
      for (const id of completedIds) {
        if (typeof id === 'string' && id) this._completedIds.add(id);
      }
    }

    for (const [id, pill] of this._quickPillEls.entries()) {
      const done = this._completedIds.has(id);
      pill.setAttribute('data-completed', done ? 'true' : 'false');
      const idEl = pill.querySelector('[data-quick-id]');
      if (idEl) idEl.style.color = done ? '#00E676' : '#00E5FF';
      const badgeEl = pill.querySelector('[data-quick-badge]');
      if (badgeEl) {
        badgeEl.textContent = done ? '✓' : 'LIVE →';
        badgeEl.style.background = done ? 'rgba(0,230,118,0.2)' : 'rgba(0,229,255,0.2)';
        badgeEl.style.color = done ? '#86F7BC' : '#80F2FF';
      }
    }

    this._applyVisualStates();
    this._renderInspector();
  }

  /**
   * Clean up event listeners and DOM nodes.
   */
  dispose() {
    for (const fn of this._cleanups) {
      try {
        fn();
      } catch {
        // Ignore
      }
    }
    this._cleanups = [];
    this._nodeEls.clear();
    this._edgeEls = [];
    this._filterButtons.clear();
    this._quickPillEls.clear();
    this._inspectorEl = null;

    if (this._container && this._root && this._root.parentNode === this._container) {
      this._container.removeChild(this._root);
    }
    this._container = null;
    this._root = null;
    this._options = {};
    this._hoveredNodeId = null;
  }
}

export default CurriculumSkillGraph;
